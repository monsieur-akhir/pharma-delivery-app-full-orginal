import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { OcrService } from '../prescriptions/services/ocr.service';

// TODO: Move these interfaces to a dto/interfaces file within the location module.
export interface LocationUpdateDto {
  deliveryId: string;
  userId: number; // ID of the user (e.g., delivery personnel) providing the update
  latitude: number;
  longitude: number;
  accuracy?: number; // Positional accuracy in meters
  altitude?: number; // Altitude in meters
  speed?: number;    // Speed in meters per second
  heading?: number;  // Direction of travel, in degrees from true north
  timestamp?: number; // Unix timestamp (milliseconds) of when the location was recorded
}

export interface LocationData extends LocationUpdateDto {
  timestamp: number; // Ensure timestamp is always present
  updatedAt?: string; // ISO string of when the record was last updated in Redis (added by RedisService potentially)
}

export interface EtaResponse {
  etaSeconds: number;
  etaFormatted: string;
  distanceKm: number;
  currentSpeedKmh?: number; // Speed used for calculation
  averageSpeedKmh: number; // Default/average speed if current not available
  unitSpeed: 'km/h';
  unitDistance: 'km';
}

export interface NearbyDelivery {
  id: string; // deliveryId
  orderId: string;
  status: string;
  distanceKm: number;
  // currentLat?: number; // Optional: current location of the delivery
  // currentLng?: number; // Optional: current location of the delivery
  pharmacy: {
    name: string;
    address: string;
  };
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly DELIVERY_KEY_PREFIX = 'delivery'; // Consistent prefix

  constructor(
    private readonly redisService: RedisService, private readonly ocrService: OcrService
  ) {}

  private getDeliveryLocationKey(deliveryId: string): string {
    return `${this.DELIVERY_KEY_PREFIX}:location:${deliveryId}`;
  }

  private getDeliveryHistoryKey(deliveryId: string): string {
    return `${this.DELIVERY_KEY_PREFIX}:location:history:${deliveryId}`;
  }

  /**
   * Update the location of a delivery.
   * This now uses the more specific setLocationUpdate from RedisService.
   */
  async updateLocation(data: LocationUpdateDto): Promise<{ success: boolean; message: string }> {
    try {
      if (!data.deliveryId || data.latitude === undefined || data.longitude === undefined) {
        throw new BadRequestException('deliveryId, latitude, and longitude are required.');
      }

      const { deliveryId, latitude, longitude, timestamp, ...additionalData } = data;
      const effectiveTimestamp = timestamp || Date.now();

      // RedisService.setLocationUpdate handles storing current location and history
      await this.redisService.setLocationUpdate(
        deliveryId,
        latitude,
        longitude,
        effectiveTimestamp,
        additionalData, // Includes userId, accuracy, altitude, speed, heading
      );

      this.logger.log(`Location updated for delivery #${deliveryId}`);
      return { success: true, message: 'Location updated successfully' };
    } catch (error: any) {
      this.logger.error(`Error updating location for delivery #${data.deliveryId}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new Error(`Failed to update location: ${error.message}`);
    }
  }

  /**
   * Get the current location of a delivery.
   * Delegates to RedisService.getCurrentLocation.
   */
  async getCurrentLocation(deliveryId: string): Promise<LocationData> {
    try {
      if (!deliveryId) {
        throw new BadRequestException('deliveryId is required.');
      }
      // RedisService.getCurrentLocation is expected to parse the data from Redis
      const locationData = await this.redisService.getCurrentLocation(deliveryId);

      if (locationData === null) {
        throw new NotFoundException(`No location data found for delivery #${deliveryId}`);
      }
      return locationData as LocationData; // Cast to ensure type conformity
    } catch (error: any) {
      this.logger.error(`Error getting current location for delivery #${deliveryId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new Error(`Failed to get current location: ${error.message}`);
    }
  }

  /**
   * Get the location history of a delivery (last N records).
   * Uses ZREVRANGE via sendCommand to bypass potential typing issues with zRevRange.
   */
  async getLocationHistory(deliveryId: string, limit: number = 50): Promise<LocationData[]> {
    try {
      if (!deliveryId) {
        throw new BadRequestException('deliveryId is required.');
      }
      if (limit <= 0) {
        return [];
      }
      const historyKey = this.getDeliveryHistoryKey(deliveryId);
      
      // Use sendCommand to execute ZREVRANGE. Expected to return string[].
      const historyStrings = await this.redisService.getClient().sendCommand<string[]>(
        ['ZREVRANGE', historyKey, '0', (limit - 1).toString()]
      );

      if (!historyStrings || historyStrings.length === 0) {
        return []; // Return empty array if no history
      }

      return historyStrings.map(entry => JSON.parse(entry) as LocationData);
    } catch (error: any) {
      this.logger.error(`Error getting location history for delivery #${deliveryId}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new Error(`Failed to get location history: ${error.message}`);
    }
  }
  
  /**
   * Remove all location data for a delivery (current and history).
   */
  async removeLocationData(deliveryId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!deliveryId) {
        throw new BadRequestException('deliveryId is required.');
      }
      const locationKey = this.getDeliveryLocationKey(deliveryId);
      const historyKey = this.getDeliveryHistoryKey(deliveryId);

      // Use RedisService.delete for individual keys
      const deleteLocationPromise = this.redisService.delete(locationKey);
      const deleteHistoryPromise = this.redisService.delete(historyKey);

      await Promise.all([deleteLocationPromise, deleteHistoryPromise]);

      this.logger.log(`Location data removed for delivery #${deliveryId}`);
      return { success: true, message: 'Location data removed successfully' };
    } catch (error: any) {
      this.logger.error(`Error removing location data for delivery #${deliveryId}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new Error(`Failed to remove location data: ${error.message}`);
    }
  }

  /**
   * Calculate estimated time of arrival.
   */
  async getETA(
    deliveryId: string,
    destinationLat: number,
    destinationLng: number,
  ): Promise<EtaResponse> {
    try {
      if (destinationLat === undefined || destinationLng === undefined) {
        throw new BadRequestException('Destination coordinates (destinationLat, destinationLng) are required.');
      }

      const currentLocation = await this.getCurrentLocation(deliveryId);

      const distanceKm = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destinationLat,
        destinationLng,
      );

      const defaultAverageSpeedKmh = 30; 
      let currentSpeedKmh: number | undefined;
      let speedForEtaCalcKmh = defaultAverageSpeedKmh;

      if (currentLocation.speed !== undefined && currentLocation.speed > 0) { 
        currentSpeedKmh = currentLocation.speed * 3.6; 
        speedForEtaCalcKmh = currentSpeedKmh;
      }
      
      if (distanceKm === 0) {
        return {
          etaSeconds: 0,
          etaFormatted: 'Arrived',
          distanceKm: 0,
          currentSpeedKmh,
          averageSpeedKmh: speedForEtaCalcKmh,
          unitSpeed: 'km/h',
          unitDistance: 'km',
        };
      }

      const etaSeconds = (distanceKm / speedForEtaCalcKmh) * 3600;
      
      const etaMinutes = Math.round(etaSeconds / 60);
      let etaFormatted: string;
      if (etaMinutes < 1) {
        etaFormatted = '< 1 minute';
      } else {
        etaFormatted = `${etaMinutes} minute${etaMinutes !== 1 ? 's' : ''}`;
      }

      return {
        etaSeconds,
        etaFormatted,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        currentSpeedKmh: currentSpeedKmh ? parseFloat(currentSpeedKmh.toFixed(2)) : undefined,
        averageSpeedKmh: parseFloat(speedForEtaCalcKmh.toFixed(2)),
        unitSpeed: 'km/h',
        unitDistance: 'km',
      };
    } catch (error: any) {
      this.logger.error(`Error calculating ETA for delivery #${deliveryId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new Error(`Failed to calculate ETA: ${error.message}`);
    }
  }

  /**
   * Find nearby deliveries for a deliverer.
   * TODO: Implement this using Redis GEO commands (GEOADD, GEORADIUS)
   *       Requires RedisService to support GEO commands.
   */
  async getNearbyDeliveries(
    latitude: number,
    longitude: number,
    radiusKm: number = 5, 
  ): Promise<NearbyDelivery[]> {
    try {
      if (latitude === undefined || longitude === undefined) {
        throw new BadRequestException('Current latitude and longitude are required.');
      }
      if (radiusKm <= 0) {
        throw new BadRequestException('Radius must be positive.');
      }

      this.logger.log(`Finding nearby deliveries for lat: ${latitude}, lon: ${longitude}, radius: ${radiusKm}km (MOCK IMPLEMENTATION)`);
      
      // MOCK IMPLEMENTATION - Replace with actual Redis GEO logic
      // Example steps:
      // 1. Ensure delivery locations are added to a Redis GEO set (e.g., 'delivery_geolocations')
      //    when updateLocation is called, storing deliveryId as the member.
      //    this.redisService.getClient().sendCommand([\'GEOADD\', \'delivery_geolocations\', longitude.toString(), latitude.toString(), deliveryId]);
      // 2. Use GEORADIUS to find deliveries: 
      //    const results = await this.redisService.getClient().sendCommand<Array<[string, string]>>([
      //      \'GEORADIUS\', \'delivery_geolocations\',
      //      longitude.toString(), latitude.toString(),
      //      radiusKm.toString(), \'km\', \'WITHDIST\' // Optionally WITHCOORD
      //    ]);
      // 3. Process results: each item might be [deliveryId, distanceString]. Fetch full details for each deliveryId.

      return [
        {
          id: 'delivery-mock-001',
          orderId: 'ORD-MOCK-123',
          status: 'ready_for_pickup',
          distanceKm: 1.2,
          pharmacy: {
            name: 'Mock Pharmacy Central',
            address: '123 Mock St',
          },
        },
        {
          id: 'delivery-mock-002',
          orderId: 'ORD-MOCK-456',
          status: 'pending_pickup',
          distanceKm: 2.5,
          pharmacy: {
            name: 'Mock Drugstore Downtown',
            address: '456 Mock Ave',
          },
        },
      ];
    } catch (error: any) {
      this.logger.error(`Error finding nearby deliveries: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new Error(`Failed to find nearby deliveries: ${error.message}`);
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
import { Injectable } from '@nestjs/common';

@Injectable()
export class LocationService {
  async updateLocation(userId: string, locationData: any) {
    // Implementation for updating user location
    try {
      // Store location in database
      return {
        success: true,
        message: 'Location updated successfully',
        data: {
          userId,
          ...locationData,
          timestamp: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Failed to update location: ${error.message}`);
    }
  }

  async getCurrentLocation(deliveryId: string) {
    // Implementation for getting current location
    try {
      return {
        deliveryId,
        latitude: 5.36037,
        longitude: -4.00837,
        address: 'Abidjan, Côte d\'Ivoire',
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get current location: ${error.message}`);
    }
  }

  async getLocationHistory(deliveryId: string) {
    // Implementation for getting location history
    try {
      return {
        deliveryId,
        history: [
          {
            latitude: 5.36037,
            longitude: -4.00837,
            timestamp: new Date(Date.now() - 3600000)
          },
          {
            latitude: 5.36100,
            longitude: -4.00800,
            timestamp: new Date()
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get location history: ${error.message}`);
    }
  }

  async calculateETA(data: any) {
    // Implementation for calculating ETA
    try {
      const { from, to } = data;
      // Simple distance calculation (in real app, use Google Maps API)
      const distance = this.calculateDistance(from, to);
      const estimatedTime = Math.round(distance * 2); // 2 minutes per km
      
      return {
        distance: `${distance.toFixed(1)} km`,
        estimatedTime: `${estimatedTime} min`,
        route: [from, to]
      };
    } catch (error) {
      throw new Error(`Failed to calculate ETA: ${error.message}`);
    }
  }

  private calculateDistance(from: any, to: any): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(to.latitude - from.latitude);
    const dLon = this.deg2rad(to.longitude - from.longitude);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(from.latitude)) * Math.cos(this.deg2rad(to.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
