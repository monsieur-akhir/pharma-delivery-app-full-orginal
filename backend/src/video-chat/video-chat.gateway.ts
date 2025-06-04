import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io/dist/socket';
import { Logger } from '@nestjs/common';
import { VideoChatService } from './video-chat.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';

interface UserSocket extends Socket {
  userId?: number;
  role?: string;
  isPharmacist?: boolean;
}

@WebSocketGateway({
  namespace: 'video-chat',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class VideoChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('VideoChatGateway');
  private activeRooms = new Map<string, { userId: number; pharmacistId: number }>();
  private userSocketMap = new Map<number, string[]>(); // userId -> socketIds[]

  constructor(
    private readonly videoChatService: VideoChatService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit() {
    this.logger.log('VideoChatGateway initialized');
  }

  async handleConnection(client: UserSocket) {
    try {
      // Authenticate user
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No auth token`);
        client.disconnect();
        return;
      }
      
      try {
        const decoded = this.jwtService.verify(token);
        client.userId = decoded.sub;
        client.role = decoded.role;
        client.isPharmacist = decoded.role === 'PHARMACIST';
        
        // Add client to user's socket list
        const userSockets = this.userSocketMap.get(client.userId) || [];
        userSockets.push(client.id);
        this.userSocketMap.set(client.userId, userSockets);
        
        // If pharmacist, set available for consultations
        if (client.isPharmacist) {
          this.videoChatService.setPharmacistAvailable(client.userId);
        }
        
        this.logger.log(`Client connected: ${client.id} as userId: ${client.userId}, role: ${client.role}`);
      } catch (error) {
        this.logger.warn(`Client ${client.id} rejected: Invalid token - ${error.message}`);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: UserSocket) {
    try {
      if (client.userId) {
        // Remove socket from user's list
        const userSockets = this.userSocketMap.get(client.userId) || [];
        const updatedSockets = userSockets.filter(socketId => socketId !== client.id);
        
        if (updatedSockets.length === 0) {
          // Last socket for this user, remove from map
          this.userSocketMap.delete(client.userId);
          
          // If pharmacist, set unavailable for consultations
          if (client.isPharmacist) {
            this.videoChatService.setPharmacistUnavailable(client.userId);
          }
        } else {
          // Update the socket list
          this.userSocketMap.set(client.userId, updatedSockets);
        }
      }
      
      this.logger.log(`Client disconnected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Disconnect error: ${error.message}`, error.stack);
    }
  }

  @SubscribeMessage('requestConsultation')
  async handleRequestConsultation(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { userId: number; username: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Not authenticated' };
      }
      
      // Create a room ID based on timestamp + user ID to ensure uniqueness
      const roomId = `room_${Date.now()}_${client.userId}`;
      
      // Check if pharmacists are available
      const availableCount = this.videoChatService.getAvailablePharmacistsCount();
      if (availableCount === 0) {
        return { success: false, message: 'No pharmacists available at the moment' };
      }
      
      // Broadcast consultation request to all connected pharmacists
      this.server.to('pharmacist_room').emit('consultationRequest', {
        roomId,
        userId: client.userId,
        username: data.username,
        timestamp: new Date(),
      });
      
      this.logger.log(`Consultation request from user ${client.userId} broadcasted to pharmacists`);
      
      return { success: true, roomId };
    } catch (error) {
      this.logger.error(`Error in requestConsultation: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to request consultation' };
    }
  }

  @SubscribeMessage('joinPharmacistRoom')
  handleJoinPharmacistRoom(@ConnectedSocket() client: UserSocket) {
    try {
      if (!client.userId || !client.isPharmacist) {
        return { success: false, message: 'Not authorized' };
      }
      
      client.join('pharmacist_room');
      this.logger.log(`Pharmacist ${client.userId} joined pharmacist room`);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in joinPharmacistRoom: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to join pharmacist room' };
    }
  }

  @SubscribeMessage('acceptConsultation')
  async handleAcceptConsultation(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { roomId: string; userId: number },
  ) {
    try {
      if (!client.userId || !client.isPharmacist) {
        return { success: false, message: 'Not authorized' };
      }
      
      // Register ongoing consultation
      await this.videoChatService.logVideoSessionStart(data.userId, client.userId, data.roomId);
      
      // Store active room information
      this.activeRooms.set(data.roomId, {
        userId: data.userId,
        pharmacistId: client.userId,
      });
      
      // Notify the user that their consultation was accepted
      const userSockets = this.userSocketMap.get(data.userId) || [];
      userSockets.forEach(socketId => {
        this.server.to(socketId).emit('consultationAccepted', {
          roomId: data.roomId,
          pharmacistId: client.userId,
        });
      });
      
      this.logger.log(`Consultation accepted by pharmacist ${client.userId} for user ${data.userId} in room ${data.roomId}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in acceptConsultation: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to accept consultation' };
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Not authenticated' };
      }
      
      client.join(data.roomId);
      this.logger.log(`User ${client.userId} joined room ${data.roomId}`);
      
      // Notify others in the room that a new user joined
      client.to(data.roomId).emit('userJoined', {
        userId: client.userId,
        role: client.role,
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in joinRoom: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to join room' };
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Not authenticated' };
      }
      
      client.leave(data.roomId);
      this.logger.log(`User ${client.userId} left room ${data.roomId}`);
      
      // Notify others that user left
      client.to(data.roomId).emit('userLeft', {
        userId: client.userId,
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in leaveRoom: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to leave room' };
    }
  }

  @SubscribeMessage('sendSignal')
  handleSendSignal(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { roomId: string; signal: any; to: number },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Not authenticated' };
      }
      
      // Get sockets for recipient
      const recipientSockets = this.userSocketMap.get(data.to) || [];
      
      // Forward the WebRTC signal to the recipient
      recipientSockets.forEach(socketId => {
        this.server.to(socketId).emit('signal', {
          from: client.userId,
          signal: data.signal,
          roomId: data.roomId,
        });
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in sendSignal: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to send signal' };
    }
  }

  @SubscribeMessage('endConsultation')
  async handleEndConsultation(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { roomId: string; duration: number },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Not authenticated' };
      }
      
      // Get room participants
      const roomInfo = this.activeRooms.get(data.roomId);
      if (!roomInfo) {
        return { success: false, message: 'Room not found' };
      }
      
      // Log end of session
      await this.videoChatService.logVideoSessionEnd(
        roomInfo.userId,
        roomInfo.pharmacistId,
        data.roomId,
        data.duration,
      );
      
      // Remove active room
      this.activeRooms.delete(data.roomId);
      
      // Notify all participants that consultation has ended
      this.server.to(data.roomId).emit('consultationEnded', {
        roomId: data.roomId,
        endedBy: client.userId,
      });
      
      this.logger.log(`Consultation ended in room ${data.roomId} by user ${client.userId}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in endConsultation: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to end consultation' };
    }
  }

  @SubscribeMessage('sendChatMessage')
  handleSendChatMessage(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { roomId: string; message: string },
  ) {
    try {
      if (!client.userId) {
        return { success: false, message: 'Not authenticated' };
      }
      
      // Broadcast the chat message to all in the room
      this.server.to(data.roomId).emit('chatMessage', {
        from: client.userId,
        message: data.message,
        timestamp: new Date(),
        role: client.role,
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in sendChatMessage: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to send message' };
    }
  }
}