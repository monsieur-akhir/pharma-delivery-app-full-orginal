import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

// Interface pour normaliser les erreurs
interface ErrorWithMessage {
  message: string;
  stack?: string;
}

// Helper function pour typer les erreurs
function toErrorWithMessage(error: unknown): ErrorWithMessage {
  if (error instanceof Error) return error;
  return {
    message: String(error),
    stack: 'No stack trace available'
  };
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;
  private isClientConnected = false;

  constructor(private readonly configService: ConfigService) {
    // Get Redis configuration from environment
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD', '');
    const redisUser = this.configService.get<string>('REDIS_USER', '');
    
    // Create Redis client
    this.client = createClient({
      url: `redis://${redisHost}:${redisPort}`,
      password: redisPassword || undefined,
      username: redisUser || undefined,
    });
    
    // Set up event handlers
    this.client.on('connect', () => {
      this.logger.log('Redis client connecting...');
    });
    
    this.client.on('ready', () => {
      this.isClientConnected = true;
      this.logger.log('Redis client ready and connected');
    });
    
    this.client.on('error', (err) => {
      this.isClientConnected = false;
      this.logger.error(`Redis client error: ${err.message}`, err.stack);
    });
    
    this.client.on('end', () => {
      this.isClientConnected = false;
      this.logger.log('Redis client disconnected');
    });
    
    // Connect to Redis
    this.connect();
  }

  /**
   * Connect to Redis
   */
  private async connect(): Promise<void> {
    try {
      if (!this.isClientConnected) {
        await this.client.connect();
      }
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to connect to Redis: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Get the Redis client instance
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Store a value in Redis with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, { EX: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to set Redis key "${key}": ${message}`, stack);
      throw error;
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to get Redis key "${key}": ${message}`, stack);
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to delete Redis key "${key}": ${message}`, stack);
      throw error;
    }
  }

  /**
   * Set hash fields
   */
  async hSet(key: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hSet(key, field, value);
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to set Redis hash field "${key}:${field}": ${message}`, stack);
      throw error;
    }
  }

  /**
   * Get hash field
   */
  async hGet(key: string, field: string): Promise<string | null> {
    try {
      const result = await this.client.hGet(key, field);
      return result ?? null; // Convert undefined to null
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to get Redis hash field "${key}:${field}": ${message}`, stack);
      throw error;
    }
  }

  /**
   * Get all hash fields
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to get all Redis hash fields "${key}": ${message}`, stack);
      throw error;
    }
  }

  /**
   * Set a new location update in Redis
   */
  async setLocationUpdate(
    deliveryId: string,
    latitude: number,
    longitude: number,
    timestamp: number,
    additionalData: Record<string, any> = {},
  ): Promise<void> {
    try {
      const locationKey = `delivery:location:${deliveryId}`;
      
      // Store current location
      await this.hSet(locationKey, 'latitude', latitude.toString());
      await this.hSet(locationKey, 'longitude', longitude.toString());
      await this.hSet(locationKey, 'timestamp', timestamp.toString());
      
      // Store additional data
      for (const [key, value] of Object.entries(additionalData)) {
        await this.hSet(locationKey, key, JSON.stringify(value));
      }
      
      // Store in location history timeline
      const historyKey = `delivery:location:history:${deliveryId}`;
      const locationData = JSON.stringify({
        latitude,
        longitude,
        timestamp,
        ...additionalData,
      });
      
      await this.client.zAdd(historyKey, {
        score: timestamp,
        value: locationData,
      });
      
      // Set TTL for both keys (e.g., 24 hours)
      const ttl = 24 * 60 * 60; // 24 hours
      await this.client.expire(locationKey, ttl);
      await this.client.expire(historyKey, ttl);
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to set location update for delivery #${deliveryId}: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Get the current location of a delivery
   */
  async getCurrentLocation(deliveryId: string): Promise<Record<string, any> | null> {
    try {
      const locationKey = `delivery:location:${deliveryId}`;
      const data = await this.hGetAll(locationKey);
      
      if (!data || Object.keys(data).length === 0) {
        return null;
      }
      
      // Parse numeric fields
      return {
        ...data,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        timestamp: parseInt(data.timestamp, 10),
      };
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to get current location for delivery #${deliveryId}: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Get location history for a delivery
   */
  async getLocationHistory(
    deliveryId: string,
    startTime: number = 0,
    endTime: number = Date.now(),
  ): Promise<Array<Record<string, any>>> {
    try {
      const historyKey = `delivery:location:history:${deliveryId}`;
      
      // Get location history within time range
      const locationData = await this.client.zRangeByScore(
        historyKey,
        startTime,
        endTime,
      );
      
      if (!locationData || locationData.length === 0) {
        return [];
      }
      
      // Parse JSON data
      return locationData.map(item => JSON.parse(item));
    } catch (error) {
      const { message, stack } = toErrorWithMessage(error);
      this.logger.error(`Failed to get location history for delivery #${deliveryId}: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Clean up resources when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    if (this.isClientConnected) {
      try {
        await this.client.quit();
        this.logger.log('Redis client disconnected gracefully');
      } catch (error) {
        this.logger.error(`Error disconnecting Redis client: ${error.message}`, error.stack);
      }
    }
  }
}