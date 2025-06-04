import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokenBlacklistService {
  private readonly PREFIX = 'token_blacklist:';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Add a token to the blacklist with its expiration time
   * @param token The JWT token to invalidate
   * @param expiryTime The Unix timestamp when the token expires
   */
  async addToBlacklist(token: string, expiryTime: number): Promise<void> {
    try {
      // Hash the token for security
      const tokenHash = await bcrypt.hash(token, 5);
      
      // Calculate TTL in seconds (from now until token expiry)
      const currentTime = Math.floor(Date.now() / 1000);
      const ttl = Math.max(expiryTime - currentTime, 0);
      
      // Store the blacklisted token with automatic expiration
      await this.redis.setex(`${this.PREFIX}${tokenHash}`, ttl, 'blacklisted');
      
      console.log(`Token blacklisted successfully, will expire in ${ttl} seconds`);
    } catch (error) {
      console.error('Error adding token to blacklist:', error);
      throw new Error('Failed to blacklist token');
    }
  }

  /**
   * Check if a token is in the blacklist
   * @param token The JWT token to check
   * @returns True if the token is blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      // Get all blacklisted tokens
      const keys = await this.redis.keys(`${this.PREFIX}*`);
      
      // Compare the token against each stored hash
      for (const key of keys) {
        const hashPart = key.replace(this.PREFIX, '');
        const isMatch = await bcrypt.compare(token, hashPart);
        if (isMatch) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking blacklisted token:', error);
      return false;
    }
  }

  /**
   * Clean up expired tokens from the blacklist
   * Note: Redis will automatically remove expired keys, so this is just a helper
   * to force cleanup if needed
   */
  async cleanupExpiredTokens(): Promise<void> {
    // Redis automatically removes expired keys, no manual cleanup needed
    console.log('Redis handles expired token cleanup automatically');
  }
}
