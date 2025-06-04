import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { LocationService, LocationUpdateDto } from './location.service';
import { OnEvent } from '@nestjs/event-emitter';

interface DeliverySubscription {
  clientId: string;
  userId: number;
  deliveryId: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to specific domains
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'delivery-tracking',
})
export class LocationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LocationGateway.name);
  
  @WebSocketServer() server: Server;
  
  // Track active client connections
  private activeClients = new Map<string, Socket>();
  
  // Track delivery subscriptions for real-time updates
  private deliverySubscriptions = new Map<string, DeliverySubscription[]>();
  
  // Track deliverer connections for updating their locations
  private delivererConnections = new Map<number, string[]>();
  
  constructor(private readonly locationService: LocationService) {}

  /**
   * Handle gateway initialization
   */
  afterInit(server: Server) {
    this.logger.log('Location WebSocket Gateway initialized');
    
    // Setup interval ping to keep connections alive
    setInterval(() => {
      this.pingClients();
    }, 30000); // 30 seconds
  }

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client connected: ${clientId}`);
    this.activeClients.set(clientId, client);
    
    // Respond with connection confirmation
    client.emit('connection_established', {
      status: 'connected',
      clientId,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client disconnected: ${clientId}`);
    
    // Remove client from active clients
    this.activeClients.delete(clientId);
    
    // Remove client from all delivery subscriptions
    for (const [deliveryId, subscriptions] of this.deliverySubscriptions.entries()) {
      const updatedSubscriptions = subscriptions.filter(sub => sub.clientId !== clientId);
      
      if (updatedSubscriptions.length === 0) {
        // No more subscribers, remove the entry completely
        this.deliverySubscriptions.delete(deliveryId);
        this.logger.debug(`Removed all subscriptions for delivery #${deliveryId}`);
      } else {
        // Update with remaining subscriptions
        this.deliverySubscriptions.set(deliveryId, updatedSubscriptions);
        this.logger.debug(`Updated subscriptions for delivery #${deliveryId}, remaining: ${updatedSubscriptions.length}`);
      }
    }
    
    // Remove client from deliverer connections
    for (const [userId, clientIds] of this.delivererConnections.entries()) {
      const updatedClientIds = clientIds.filter(id => id !== clientId);
      
      if (updatedClientIds.length === 0) {
        // No more connections for this deliverer
        this.delivererConnections.delete(userId);
        this.logger.debug(`Removed all connections for deliverer #${userId}`);
      } else {
        // Update with remaining connections
        this.delivererConnections.set(userId, updatedClientIds);
        this.logger.debug(`Updated connections for deliverer #${userId}, remaining: ${updatedClientIds.length}`);
      }
    }
  }

  /**
   * Keep connections alive with ping-pong mechanism
   */
  private pingClients() {
    for (const [clientId, client] of this.activeClients.entries()) {
      try {
        client.emit('ping', { timestamp: Date.now() });
      } catch (error) {
        this.logger.error(`Failed to ping client ${clientId}: ${error.message}`);
        // Si le ping échoue, nous supposons que le client est déconnecté
        this.activeClients.delete(clientId);
        
        // Nettoyer les autres références à ce client
        this.handleDisconnect({ id: clientId } as Socket);
      }
    }
  }

  /**
   * Handle authentication
   */
  @SubscribeMessage('authenticate')
  handleAuthentication(client: Socket, payload: { userId: number, role: string }): WsResponse<any> {
    this.logger.log(`Client ${client.id} authenticating as user ${payload.userId} with role ${payload.role}`);
    
    // Store user info in client data
    client.data.userId = payload.userId;
    client.data.role = payload.role;
    
    // If this is a deliverer, store the connection
    if (payload.role === 'deliverer') {
      const clientIds = this.delivererConnections.get(payload.userId) || [];
      clientIds.push(client.id);
      this.delivererConnections.set(payload.userId, clientIds);
    }
    
    return {
      event: 'authenticate_result',
      data: {
        status: 'authenticated',
        userId: payload.userId,
        role: payload.role,
      },
    };
  }

  /**
   * Subscribe to delivery location updates
   */
  @SubscribeMessage('subscribe_delivery')
  async handleSubscribeDelivery(client: Socket, payload: { deliveryId: string }): Promise<WsResponse<any>> {
    try {
      const { deliveryId } = payload;
      const userId = client.data.userId || null;
      
      this.logger.log(`Client ${client.id} subscribing to delivery #${deliveryId} updates`);
      
      // Add to delivery subscriptions
      let subscriptions = this.deliverySubscriptions.get(deliveryId) || [];
      
      // Check if already subscribed
      const existingSubscription = subscriptions.find(sub => sub.clientId === client.id);
      
      if (!existingSubscription) {
        subscriptions.push({
          clientId: client.id,
          userId,
          deliveryId,
        });
        
        this.deliverySubscriptions.set(deliveryId, subscriptions);
      }
      
      // Join the delivery room
      client.join(`delivery:${deliveryId}`);
      
      // Get current location
      const currentLocation = await this.locationService.getCurrentLocation(deliveryId);
      
      return {
        event: 'subscription_result',
        data: {
          status: 'subscribed',
          deliveryId,
          currentLocation,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to subscribe to delivery: ${error.message}`, error.stack);
      
      return {
        event: 'subscription_result',
        data: {
          status: 'error',
          message: error.message,
        },
      };
    }
  }

  /**
   * Unsubscribe from delivery location updates
   */
  @SubscribeMessage('unsubscribe_delivery')
  handleUnsubscribeDelivery(client: Socket, payload: { deliveryId: string }): WsResponse<any> {
    const { deliveryId } = payload;
    
    this.logger.log(`Client ${client.id} unsubscribing from delivery #${deliveryId} updates`);
    
    // Remove from delivery subscriptions
    const subscriptions = this.deliverySubscriptions.get(deliveryId) || [];
    const updatedSubscriptions = subscriptions.filter(sub => sub.clientId !== client.id);
    
    if (updatedSubscriptions.length === 0) {
      this.deliverySubscriptions.delete(deliveryId);
    } else {
      this.deliverySubscriptions.set(deliveryId, updatedSubscriptions);
    }
    
    // Leave the delivery room
    client.leave(`delivery:${deliveryId}`);
    
    return {
      event: 'unsubscription_result',
      data: {
        status: 'unsubscribed',
        deliveryId,
      },
    };
  }

  /**
   * Update delivery location
   */
  @SubscribeMessage('update_location')
  async handleLocationUpdate(client: Socket, payload: LocationUpdateDto): Promise<WsResponse<any>> {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        throw new Error('Authentication required');
      }
      
      // Verify this user is a deliverer
      if (client.data.role !== 'deliverer') {
        throw new Error('Only deliverers can update locations');
      }
      
      // Set userId from authenticated session
      payload.userId = userId;
      
      // Set timestamp if not provided
      if (!payload.timestamp) {
        payload.timestamp = Date.now();
      }
      
      // Update location
      await this.locationService.updateLocation(payload);
      
      return {
        event: 'location_update_result',
        data: {
          status: 'success',
          deliveryId: payload.deliveryId,
          timestamp: payload.timestamp,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update location: ${error.message}`, error.stack);
      
      return {
        event: 'location_update_result',
        data: {
          status: 'error',
          message: error.message,
        },
      };
    }
  }

  /**
   * Get location history
   */
  @SubscribeMessage('get_location_history')
  async handleGetLocationHistory(
    client: Socket,
    payload: {
      deliveryId: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    },
  ): Promise<WsResponse<any>> {
    try {
      const { deliveryId, startTime, endTime, limit } = payload;
      
      this.logger.log(`Client ${client.id} requesting location history for delivery #${deliveryId}`);
      
      // Get location history
      const history = await this.locationService.getLocationHistory(deliveryId, limit);
      
      return {
        event: 'location_history_result',
        data: {
          status: 'success',
          deliveryId,
          history,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get location history: ${error.message}`, error.stack);
      
      return {
        event: 'location_history_result',
        data: {
          status: 'error',
          message: error.message,
        },
      };
    }
  }

  /**
   * Listen for location update events and broadcast to subscribers
   */
  @OnEvent('location.updated')
  handleLocationUpdatedEvent(payload: any) {
    const { deliveryId } = payload;
    
    this.logger.debug(`Broadcasting location update for delivery #${deliveryId}`);
    
    // Broadcast to all subscribers in the delivery room
    this.server.to(`delivery:${deliveryId}`).emit('location_updated', payload);
  }
}