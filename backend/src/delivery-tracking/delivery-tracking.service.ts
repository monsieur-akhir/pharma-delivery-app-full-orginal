import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { 
  delivery_tracking,
  orders,
  users,
  type DeliveryTracking,
  type InsertDeliveryTracking
} from '../../../shared/schema';

@Injectable()
export class DeliveryTrackingService {
  private readonly logger = new Logger(DeliveryTrackingService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Update the location of a delivery person for a specific order
   */
  async updateDeliveryLocation(
    orderId: number,
    deliveryPersonId: number,
    locationData: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      battery_level?: number;
    }
  ): Promise<DeliveryTracking> {
    try {
      // Check if there's an active tracking record for this order and delivery person
      const [existingTracking] = await this.databaseService.db
        .select()
        .from(delivery_tracking)
        .where(
          and(
            eq(delivery_tracking.order_id, orderId),
            eq(delivery_tracking.delivery_person_id, deliveryPersonId),
            eq(delivery_tracking.is_active, true)
          )
        );

      if (existingTracking) {
        // Update the existing record
        const [updatedTracking] = await this.databaseService.db
          .update(delivery_tracking)
          .set({
            current_location: { lat: locationData.lat, lng: locationData.lng },
            heading: locationData.heading || null,
            speed: locationData.speed?.toString() || null,
            accuracy: locationData.accuracy?.toString() || null,
            battery_level: locationData.battery_level?.toString() || null,
            timestamp: new Date(),
          })
          .where(eq(delivery_tracking.id, existingTracking.id))
          .returning();

        return updatedTracking;
      } else {
        // Create a new tracking record
        const insertData: InsertDeliveryTracking = {
          order_id: orderId,
          delivery_person_id: deliveryPersonId,
          current_location: { lat: locationData.lat, lng: locationData.lng },
          heading: locationData.heading || null,
          speed: locationData.speed?.toString() || null,
          accuracy: locationData.accuracy?.toString() || null,
          battery_level: locationData.battery_level?.toString() || null,
          timestamp: new Date(),
          is_active: true,
        };

        const [newTracking] = await this.databaseService.db
          .insert(delivery_tracking)
          .values(insertData)
          .returning();

        return newTracking;
      }
    } catch (error) {
      this.logger.error(
        `Error updating delivery location for order ${orderId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get the current location of a delivery person for a specific order
   */
  async getOrderDeliveryLocation(orderId: number): Promise<DeliveryTracking | null> {
    try {
      // Get the most recent tracking data for this order
      const [latestTracking] = await this.databaseService.db
        .select()
        .from(delivery_tracking)
        .where(
          and(
            eq(delivery_tracking.order_id, orderId),
            eq(delivery_tracking.is_active, true)
          )
        )
        .orderBy(desc(delivery_tracking.timestamp))
        .limit(1);

      return latestTracking || null;
    } catch (error) {
      this.logger.error(
        `Error getting delivery location for order ${orderId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get all active delivery locations for a delivery person
   */
  async getDeliveryPersonActiveLocations(deliveryPersonId: number): Promise<DeliveryTracking[]> {
    try {
      return this.databaseService.db
        .select()
        .from(delivery_tracking)
        .where(
          and(
            eq(delivery_tracking.delivery_person_id, deliveryPersonId),
            eq(delivery_tracking.is_active, true)
          )
        );
    } catch (error) {
      this.logger.error(
        `Error getting active locations for delivery person ${deliveryPersonId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * End tracking for an order (when delivery is complete)
   */
  async endOrderTracking(orderId: number): Promise<boolean> {
    try {
      const result = await this.databaseService.db
        .update(delivery_tracking)
        .set({
          is_active: false,
        })
        .where(
          and(
            eq(delivery_tracking.order_id, orderId),
            eq(delivery_tracking.is_active, true)
          )
        );

      return true;
    } catch (error) {
      this.logger.error(
        `Error ending tracking for order ${orderId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get delivery history for an order with timestamps
   */
  async getOrderDeliveryHistory(orderId: number): Promise<DeliveryTracking[]> {
    try {
      // Get all tracking data for this order ordered by timestamp
      return this.databaseService.db
        .select()
        .from(delivery_tracking)
        .where(eq(delivery_tracking.order_id, orderId))
        .orderBy(delivery_tracking.timestamp);
    } catch (error) {
      this.logger.error(
        `Error getting delivery history for order ${orderId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get all active orders that are currently being delivered
   */
  async getActiveDeliveries(user: any): Promise<any[]> {
    try {
      // Find all orders with status OUT_FOR_DELIVERY and join with delivery tracking
      const activeDeliveries = await this.databaseService.db
        .select({
          order: orders,
          tracking: delivery_tracking,
          delivery_person: {
            id: users.id,
            username: users.username,
            phone: users.phone,
            profile_image: users.profile_image,
          },
        })
        .from(orders)
        .leftJoin(
          delivery_tracking,
          and(
            eq(orders.id, delivery_tracking.order_id),
            eq(delivery_tracking.is_active, true)
          )
        )
        .leftJoin(
          users,
          eq(orders.delivery_person_id, users.id)
        )
        .where(
          eq(orders.status, 'OUT_FOR_DELIVERY')
        );

      return activeDeliveries;
    } catch (error) {
      this.logger.error(
        `Error getting active deliveries: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get estimated time of arrival based on distance and average speed
   */
  async getEstimatedTimeOfArrival(orderId: number): Promise<{ eta: Date | null; distance: number | null }> {
    try {
      // Get the order with delivery coordinates
      const [order] = await this.databaseService.db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order || !order.delivery_coordinates) {
        return { eta: null, distance: null };
      }

      // Get the latest tracking data
      const [tracking] = await this.databaseService.db
        .select()
        .from(delivery_tracking)
        .where(
          and(
            eq(delivery_tracking.order_id, orderId),
            eq(delivery_tracking.is_active, true)
          )
        )
        .orderBy(desc(delivery_tracking.timestamp))
        .limit(1);

      if (!tracking) {
        return { eta: null, distance: null };
      }

      const deliveryCoords = order.delivery_coordinates as { lat: number; lng: number };
      const currentCoords = tracking.current_location as { lat: number; lng: number };

      // Calculate distance in kilometers using Haversine formula
      const distance = this.calculateDistance(
        currentCoords.lat,
        currentCoords.lng,
        deliveryCoords.lat,
        deliveryCoords.lng
      );

      // Estimate speed (if not available, use default of 20 km/h)
      const speed = tracking.speed ? parseFloat(tracking.speed.toString()) : 20;

      // Calculate estimated time in hours
      const timeInHours = distance / Math.max(speed, 5); // Ensure minimum speed
      
      // Calculate ETA
      const eta = new Date();
      eta.setHours(eta.getHours() + timeInHours);

      return { eta, distance };
    } catch (error) {
      this.logger.error(
        `Error calculating ETA for order ${orderId}: ${error.message}`,
        error.stack
      );
      return { eta: null, distance: null };
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Find all deliveries with optional filtering
   */
  async findAll(filterDto: any, user: any): Promise<any[]> {
    try {
      // Use SQL template literals for type-safe queries
      const { sql } = require('drizzle-orm');
      
      // Build a dynamic SQL query using string concatenation and template literals
      let sqlQuery = sql`
        SELECT dt.*, o.*, u.* FROM delivery_tracking dt
        LEFT JOIN orders o ON dt.order_id = o.id
        LEFT JOIN users u ON dt.delivery_person_id = u.id 
        WHERE 1=1
      `;
      
      // Add conditions based on user role and filters
      // Using array of conditions that we'll join later
      const conditions = [];
      const params = [];
      
      if (user.role === 'PHARMACY_STAFF' || user.role === 'PHARMACIST') {
        conditions.push(sql`o.pharmacy_id = ${user.pharmacyId}`);
      }
      
      if (user.role === 'DELIVERY_PERSON') {
        conditions.push(sql`dt.delivery_person_id = ${user.id}`);
      }
      
      if (filterDto.status) {
        conditions.push(sql`o.status = ${filterDto.status}`);
      }
      
      if (filterDto.pharmacyId) {
        conditions.push(sql`o.pharmacy_id = ${filterDto.pharmacyId}`);
      }
      
      if (filterDto.deliveryPersonId) {
        conditions.push(sql`dt.delivery_person_id = ${filterDto.deliveryPersonId}`);
      }
      
      if (filterDto.date) {
        const startOfDay = new Date(filterDto.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filterDto.date);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(sql`dt.timestamp >= ${startOfDay} AND dt.timestamp <= ${endOfDay}`);
      }
      
      // Combine all conditions with AND
      if (conditions.length > 0) {
        // For each condition, add it with AND
        for (const condition of conditions) {
          sqlQuery = sql`${sqlQuery} AND ${condition}`;
        }
      }
      
      // Add order by
      sqlQuery = sql`${sqlQuery} ORDER BY dt.timestamp DESC`;
      
      // Add pagination if specified
      if (filterDto.page && filterDto.limit) {
        const page = parseInt(filterDto.page);
        const limit = parseInt(filterDto.limit);
        const offset = (page - 1) * limit;
        sqlQuery = sql`${sqlQuery} LIMIT ${limit} OFFSET ${offset}`;
      }
      
      const result = await this.databaseService.db.execute(sqlQuery);
      return result.rows;
    } catch (error) {
      this.logger.error(`Failed to get deliveries: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find one delivery by ID
   */
  async findOne(id: number, user: any): Promise<any> {
    try {
      // Import sql depuis drizzle-orm pour les requêtes brutes
      const { sql } = require('drizzle-orm');
      
      // Utiliser une requête SQL brute pour simplifier le join et l'accès aux données
      const result = await this.databaseService.db.execute(
        sql`
          SELECT 
            dt.*, 
            o.pharmacy_id, 
            o.user_id, 
            o.delivery_person_id as order_delivery_person_id,
            o.status as order_status
          FROM delivery_tracking dt
          LEFT JOIN orders o ON dt.order_id = o.id
          WHERE dt.id = ${id}
        `
      );
      
      const delivery = result.rows?.[0];
      
      if (!delivery) {
        throw new Error('Delivery not found');
      }
      
      // Check permissions based on user role
      if (user.role === 'PHARMACY_STAFF' || user.role === 'PHARMACIST') {
        if (delivery.pharmacy_id !== user.pharmacyId) {
          throw new Error('Unauthorized to view this delivery');
        }
      }
      
      if (user.role === 'DELIVERY_PERSON') {
        // Explicitly cast to access properties from the SQL result
        const deliveryData = delivery as any;
        if (deliveryData.delivery_person_id !== user.id) {
          throw new Error('Unauthorized to view this delivery');
        }
      }
      
      if (user.role === 'CUSTOMER') {
        if (delivery.user_id !== user.id) {
          throw new Error('Unauthorized to view this delivery');
        }
      }
      
      return delivery;
    } catch (error) {
      this.logger.error(`Failed to get delivery #${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update delivery location
   */
  async updateLocation(locationUpdateDto: any, user: any): Promise<any> {
    try {
      // Ensure the user is a delivery person
      if (user.role !== 'DELIVERY_PERSON') {
        throw new Error('Only delivery personnel can update delivery locations');
      }
      
      const { deliveryId, latitude, longitude, heading, speed } = locationUpdateDto;
      
      // Get the delivery tracking record
      const [delivery] = await this.databaseService.db
        .select()
        .from(delivery_tracking)
        .where(eq(delivery_tracking.id, deliveryId));
      
      if (!delivery) {
        throw new Error('Delivery not found');
      }
      
      // Ensure this delivery is assigned to the current delivery person
      if ((delivery as any).delivery_person_id !== user.id) {
        throw new Error('Unauthorized to update this delivery');
      }
      
      // Update the location
      const [updatedDelivery] = await this.databaseService.db
        .update(delivery_tracking)
        .set({
          current_location: { lat: latitude, lng: longitude },
          heading: heading || delivery.heading,
          speed: speed ? speed.toString() : delivery.speed,
          timestamp: new Date(), // Update timestamp instead of last_updated
        })
        .where(eq(delivery_tracking.id, deliveryId))
        .returning();
      
      // Emit location update event
      // Note: This would typically use an event emitter service
      
      return updatedDelivery;
    } catch (error) {
      this.logger.error(`Failed to update delivery location: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update delivery status
   */
  async updateStatus(statusUpdateDto: any, user: any): Promise<any> {
    try {
      const { deliveryId, status, notes } = statusUpdateDto;
      
      // Get the delivery tracking record
      const [delivery] = await this.databaseService.db
        .select()
        .from(delivery_tracking)
        .leftJoin(orders, eq(delivery_tracking.order_id, orders.id))
        .where(eq(delivery_tracking.id, deliveryId));
      
      if (!delivery) {
        throw new Error('Delivery not found');
      }
      
      // Check permissions based on user role
      if (user.role === 'DELIVERY_PERSON') {
        if ((delivery as any).delivery_person_id !== user.id) {
          throw new Error('Unauthorized to update this delivery');
        }
      } else if (user.role === 'PHARMACY_STAFF' || user.role === 'PHARMACIST') {
        const orderData = (delivery as any).orders;
        if (orderData.pharmacy_id !== user.pharmacyId) {
          throw new Error('Unauthorized to update this delivery');
        }
      } else {
        throw new Error('Unauthorized to update delivery status');
      }
      
      // Instead of updating status in delivery_tracking (which doesn't exist),
      // we'll update the order status directly
      const [updatedOrder] = await this.databaseService.db
        .update(orders)
        .set({
          status: status,
          updated_at: new Date(),
          ...(status === 'DELIVERED' && { actual_delivery_time: new Date() })
        })
        .where(eq(orders.id, (delivery as any).order_id as number))
        .returning();
      
      // Update the is_active flag if delivered
      if (status === 'DELIVERED') {
        await this.databaseService.db
          .update(delivery_tracking)
          .set({
            is_active: false,
            timestamp: new Date()
          })
          .where(eq(delivery_tracking.id, deliveryId));
      }
      
      // Return combined data
      return {
        ...delivery,
        order_status: updatedOrder.status,
      };
    } catch (error) {
      this.logger.error(`Failed to update delivery status: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get delivery statistics
   */
  async getStatistics(user: any): Promise<any> {
    try {
      // Import sql depuis drizzle-orm
      const { sql } = require('drizzle-orm');
      
      // Base query to count deliveries by status
      let statusCountQuery = `
        SELECT o.status as status, COUNT(*) as count
        FROM delivery_tracking dt
        LEFT JOIN orders o ON dt.order_id = o.id
      `;
      
      if (user.role === 'PHARMACY_STAFF' || user.role === 'PHARMACIST') {
        statusCountQuery += ` WHERE o.pharmacy_id = ${user.pharmacyId}`;
      }
      
      statusCountQuery += ` GROUP BY o.status`;
      
      const statusCountsResult = await this.databaseService.db.execute(
        sql`${sql.raw(statusCountQuery)}`
      );
      
      // Get today's deliveries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayCountQuery = `
        SELECT COUNT(*) as count
        FROM delivery_tracking dt
        LEFT JOIN orders o ON dt.order_id = o.id
        WHERE dt.timestamp >= '${today.toISOString()}'
      `;
      
      if (user.role === 'PHARMACY_STAFF' || user.role === 'PHARMACIST') {
        todayCountQuery += ` AND o.pharmacy_id = ${user.pharmacyId}`;
      }
      
      const todayCountResult = await this.databaseService.db.execute(
        sql`${sql.raw(todayCountQuery)}`
      );
      
      // Format the response
      const statusCounts = statusCountsResult.rows || [];
      const todayCount = parseInt(String(todayCountResult.rows?.[0]?.count || '0'));
      
      const result = {
        total: statusCounts.reduce((sum, item) => sum + parseInt(String(item.count)), 0),
        today: todayCount,
        byStatus: {} as Record<string, number>,
      };
      
      // Convert array of status counts to object
      statusCounts.forEach(item => {
        result.byStatus[String(item.status)] = parseInt(String(item.count));
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to get delivery statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get location history for a delivery
   */
  async getLocationHistory(deliveryId: number, user: any): Promise<any[]> {
    try {
      // Import sql depuis drizzle-orm
      const { sql } = require('drizzle-orm');
      
      // Get the delivery to check permissions
      const delivery = await this.findOne(deliveryId, user);
      
      // Get location history from the database
      // Since there's no dedicated location_history table, we'll return the delivery tracking
      // record itself, which contains the current location
      const locationHistory = await this.databaseService.db.execute(
        sql`SELECT * FROM delivery_tracking 
            WHERE order_id = ${(delivery as any).order_id} 
            ORDER BY timestamp DESC`
      );
      
      return locationHistory.rows || [];
    } catch (error) {
      this.logger.error(`Failed to get location history for delivery #${deliveryId}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get estimated time of arrival for a delivery
   */
  async getEta(deliveryId: number, user: any): Promise<any> {
    try {
      // Import sql depuis drizzle-orm pour les requêtes brutes
      const { sql } = require('drizzle-orm');
      
      // Get the delivery to check permissions
      const delivery = await this.findOne(deliveryId, user);
      
      // If delivery doesn't have current location, can't calculate ETA
      if (!delivery.current_location) {
        return {
          eta: null,
          distance: null,
          message: 'No current location available for this delivery',
        };
      }
      
      // Get destination coordinates from order
      const orderResult = await this.databaseService.db.execute(
        sql`
          SELECT delivery_coordinates, delivery_address
          FROM orders
          WHERE id = ${(delivery as any).order_id}
        `
      );
      
      const order = orderResult.rows?.[0];
      
      if (!order || !order.delivery_coordinates) {
        return {
          eta: null,
          distance: null,
          message: 'No destination coordinates available',
        };
      }
      
      // Parse coordinates if they're stored as string
      let destinationCoords;
      if (typeof order.delivery_coordinates === 'string') {
        try {
          destinationCoords = JSON.parse(order.delivery_coordinates);
        } catch (e) {
          return {
            eta: null,
            distance: null, 
            message: 'Invalid destination coordinates format',
          };
        }
      } else {
        destinationCoords = order.delivery_coordinates;
      }
      
      // Parse current location if stored as string
      let currentLocation;
      if (typeof delivery.current_location === 'string') {
        try {
          currentLocation = JSON.parse(delivery.current_location);
        } catch (e) {
          return {
            eta: null,
            distance: null,
            message: 'Invalid current location format',
          };
        }
      } else {
        currentLocation = delivery.current_location;
      }
      
      // Calculate distance
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        destinationCoords.lat,
        destinationCoords.lng
      );
      
      // Estimate time (assuming average speed of 30 km/h or using current speed if available)
      const averageSpeed = delivery.speed ? parseFloat(String(delivery.speed)) : 30; // km/h
      const timeInHours = distance / Math.max(averageSpeed, 5); // Ensure minimum speed
      const timeInMinutes = Math.round(timeInHours * 60);
      
      // Calculate ETA
      const now = new Date();
      const eta = new Date(now.getTime() + timeInMinutes * 60 * 1000);
      
      return {
        eta: eta,
        etaMinutes: timeInMinutes,
        distance: distance,
        currentLocation: currentLocation,
        destination: destinationCoords,
        address: order.delivery_address,
        lastUpdated: delivery.timestamp,
        speed: averageSpeed
      };
    } catch (error) {
      this.logger.error(`Failed to calculate ETA for delivery #${deliveryId}: ${error.message}`, error.stack);
      return {
        eta: null,
        distance: null,
        message: `Error calculating ETA: ${error.message}`,
      };
    }
  }
  
  /**
   * Get delivery route
   */
  async getRoute(deliveryId: number, user: any): Promise<any> {
    try {
      // Import sql depuis drizzle-orm pour les requêtes brutes
      const { sql } = require('drizzle-orm');
      
      // Get the delivery to check permissions
      const delivery = await this.findOne(deliveryId, user);
      
      // Get order information for destination
      const orderResult = await this.databaseService.db.execute(
        sql`
          SELECT o.*, p.address as pharmacy_address, p.location as pharmacy_location
          FROM orders o
          LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
          WHERE o.id = ${(delivery as any).order_id}
        `
      );
      
      const order = orderResult.rows?.[0];
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Parse coordinates if they're stored as strings
      let currentLocation;
      if (typeof delivery.current_location === 'string') {
        try {
          currentLocation = JSON.parse(delivery.current_location);
        } catch (e) {
          currentLocation = null;
        }
      } else {
        currentLocation = delivery.current_location;
      }
      
      let destinationCoords;
      if (typeof order.delivery_coordinates === 'string') {
        try {
          destinationCoords = JSON.parse(order.delivery_coordinates);
        } catch (e) {
          destinationCoords = null;
        }
      } else {
        destinationCoords = order.delivery_coordinates;
      }
      
      let pharmacyLocation;
      if (typeof order.pharmacy_location === 'string') {
        try {
          pharmacyLocation = JSON.parse(order.pharmacy_location);
        } catch (e) {
          pharmacyLocation = null;
        }
      } else {
        pharmacyLocation = order.pharmacy_location;
      }
      
      // This would typically call a maps API for routing
      // For now, we'll return a simplified route
      return {
        origin: {
          lat: pharmacyLocation?.lat || null,
          lng: pharmacyLocation?.lng || null,
          address: order.pharmacy_address || null,
        },
        destination: {
          lat: destinationCoords?.lat || null,
          lng: destinationCoords?.lng || null,
          address: order.delivery_address || null,
        },
        currentLocation: currentLocation || null,
        estimatedDistance: currentLocation && destinationCoords ? 
          this.calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            destinationCoords.lat,
            destinationCoords.lng
          ) : null,
        // In a real implementation, this would include waypoints
        waypoints: [],
      };
    } catch (error) {
      this.logger.error(`Failed to get route for delivery #${deliveryId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}