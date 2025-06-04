import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DeliveryTrackingService } from './delivery-tracking.service';
import { UpdateLocationDto } from './dto/update-location.dto';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  role?: string;
  isDeliveryPerson?: boolean;
}

@WebSocketGateway({
  namespace: 'delivery-tracking',
  cors: {
    origin: '*',
  },
})
export class DeliveryTrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('DeliveryTrackingGateway');
  private userToOrdersMap = new Map<number, Set<number>>(); // userId -> Set of orderIds
  private orderToUsersMap = new Map<number, Set<number>>(); // orderId -> Set of userIds
  private userSocketMap = new Map<number, Set<AuthenticatedSocket>>(); // userId -> Set of sockets

  constructor(
    private readonly deliveryTrackingService: DeliveryTrackingService,
    private readonly jwtService: JwtService
  ) {}

  afterInit() {
    this.logger.log('Delivery Tracking Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1] || 
                   client.handshake.auth.token;

      if (!token) {
        this.logger.warn('Client attempted to connect without a token');
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      client.userId = decoded.sub;
      client.role = decoded.role;
      client.isDeliveryPerson = decoded.role === 'DELIVERY_PERSON';

      this.logger.log(`Client connected: ${client.id}, userId: ${client.userId}, role: ${client.role}`);

      // Store socket connection
      const userSockets = this.userSocketMap.get(client.userId) || new Set();
      userSockets.add(client);
      this.userSocketMap.set(client.userId, userSockets);
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove from user socket map
      const userSockets = this.userSocketMap.get(client.userId);
      if (userSockets) {
        userSockets.delete(client);
        if (userSockets.size === 0) {
          this.userSocketMap.delete(client.userId);
        } else {
          this.userSocketMap.set(client.userId, userSockets);
        }
      }

      // If it's a delivery person, handle their tracked orders
      if (client.isDeliveryPerson) {
        const ordersTracked = this.userToOrdersMap.get(client.userId);
        if (ordersTracked) {
          // Notify subscribed users that tracking might be interrupted
          ordersTracked.forEach(orderId => {
            this.server.to(`order:${orderId}`).emit('tracking_interrupted', {
              message: 'Delivery person disconnected temporarily',
              orderId,
              deliveryPersonId: client.userId
            });
          });
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_to_order')
  handleSubscribeToOrder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: number }
  ) {
    if (!client.userId) return;

    const { orderId } = data;
    
    // Add user to the room for this order
    client.join(`order:${orderId}`);
    
    // Track which orders this user is tracking
    const userOrders = this.userToOrdersMap.get(client.userId) || new Set();
    userOrders.add(orderId);
    this.userToOrdersMap.set(client.userId, userOrders);
    
    // Track which users are tracking this order
    const orderUsers = this.orderToUsersMap.get(orderId) || new Set();
    orderUsers.add(client.userId);
    this.orderToUsersMap.set(orderId, orderUsers);
    
    this.logger.log(`User ${client.userId} subscribed to order ${orderId}`);
    
    // Send current tracking data if available
    this.sendLatestTrackingData(orderId);
    
    return { success: true };
  }
  
  @SubscribeMessage('unsubscribe_from_order')
  handleUnsubscribeFromOrder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: number }
  ) {
    if (!client.userId) return;

    const { orderId } = data;
    
    // Remove user from the room for this order
    client.leave(`order:${orderId}`);
    
    // Update tracking maps
    const userOrders = this.userToOrdersMap.get(client.userId);
    if (userOrders) {
      userOrders.delete(orderId);
      if (userOrders.size === 0) {
        this.userToOrdersMap.delete(client.userId);
      } else {
        this.userToOrdersMap.set(client.userId, userOrders);
      }
    }
    
    const orderUsers = this.orderToUsersMap.get(orderId);
    if (orderUsers) {
      orderUsers.delete(client.userId);
      if (orderUsers.size === 0) {
        this.orderToUsersMap.delete(orderId);
      } else {
        this.orderToUsersMap.set(orderId, orderUsers);
      }
    }
    
    this.logger.log(`User ${client.userId} unsubscribed from order ${orderId}`);
    
    return { success: true };
  }
  
  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: UpdateLocationDto & { orderId: number }
  ) {
    if (!client.userId || !client.isDeliveryPerson) {
      return { success: false, message: 'Unauthorized' };
    }

    try {
      const { orderId, ...locationData } = data;
      
      // Update database
      const tracking = await this.deliveryTrackingService.updateDeliveryLocation(
        orderId,
        client.userId,
        locationData
      );
      
      // Broadcast to all clients subscribed to this order
      this.server.to(`order:${orderId}`).emit('location_updated', {
        orderId,
        deliveryPersonId: client.userId,
        ...tracking
      });
      
      // Calculate and broadcast ETA
      this.broadcastETA(orderId);
      
      return { success: true, data: tracking };
    } catch (error) {
      this.logger.error(`Error updating location: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
  
  @SubscribeMessage('end_tracking')
  async handleEndTracking(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: number }
  ) {
    if (!client.userId || !client.isDeliveryPerson) {
      return { success: false, message: 'Unauthorized' };
    }

    try {
      const { orderId } = data;
      
      // End tracking in database
      await this.deliveryTrackingService.endOrderTracking(orderId);
      
      // Notify all subscribed clients
      this.server.to(`order:${orderId}`).emit('tracking_ended', {
        orderId,
        deliveryPersonId: client.userId,
        timestamp: new Date()
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error ending tracking: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * Send the latest tracking data for an order to all subscribed clients
   */
  private async sendLatestTrackingData(orderId: number) {
    try {
      const tracking = await this.deliveryTrackingService.getOrderDeliveryLocation(orderId);
      
      if (tracking) {
        this.server.to(`order:${orderId}`).emit('location_updated', {
          orderId,
          deliveryPersonId: tracking.delivery_person_id,
          ...tracking
        });
        
        // Also send ETA information
        this.broadcastETA(orderId);
      }
    } catch (error) {
      this.logger.error(`Error sending latest tracking data: ${error.message}`);
    }
  }
  
  /**
   * Calculate and broadcast ETA for an order
   */
  private async broadcastETA(orderId: number) {
    try {
      const eta = await this.deliveryTrackingService.getEstimatedTimeOfArrival(orderId);
      
      if (eta) {
        this.server.to(`order:${orderId}`).emit('eta_updated', {
          orderId,
          ...eta
        });
      }
    } catch (error) {
      this.logger.error(`Error broadcasting ETA: ${error.message}`);
    }
  }
}