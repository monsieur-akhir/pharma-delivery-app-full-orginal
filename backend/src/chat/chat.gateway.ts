import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as WebSocket from 'ws';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { InsertMessage } from '../../../shared/schema';

// Create a type that combines WebSocket with our custom properties
type ExtendedWebSocket = WebSocket & {
  userId?: number;
  isAlive: boolean;
};

const WS_OPEN = 1; // WebSocket.OPEN constant

@WebSocketGateway({ 
  path: '/ws/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<number, ExtendedWebSocket[]> = new Map();
  private pingInterval: NodeJS.Timeout;

  constructor(private readonly chatService: ChatService) {
    // Set up ping interval to keep connections alive
    this.pingInterval = setInterval(() => this.pingClients(), 30000);
  }

  afterInit() {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: any) {
    const wsClient = client as ExtendedWebSocket;
    wsClient.isAlive = true;
    wsClient.on('pong', () => {
      wsClient.isAlive = true;
    });
    console.log('Client connected to chat websocket');
  }

  handleDisconnect(client: any) {
    const wsClient = client as ExtendedWebSocket;
    if (wsClient.userId) {
      this.removeClient(wsClient.userId, wsClient);
    }
    console.log('Client disconnected from chat websocket');
  }

  @SubscribeMessage('authenticate')
  handleAuthentication(
    @ConnectedSocket() client: any,
    @MessageBody() data: { userId: number }
  ) {
    try {
      const wsClient = client as ExtendedWebSocket;
      const { userId } = data;
      
      // Set the userId on the client
      wsClient.userId = userId;
      
      // Add client to the connected clients map
      if (!this.connectedClients.has(userId)) {
        this.connectedClients.set(userId, []);
      }
      this.connectedClients.get(userId).push(wsClient);
      
      return { status: 'authenticated', userId };
    } catch (error) {
      console.error('Authentication error:', error);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: any,
    @MessageBody() messageData: CreateMessageDto
  ) {
    const wsClient = client as ExtendedWebSocket;
    try {
      // Verify user is authenticated
      if (!wsClient.userId) {
        return { 
          status: 'error', 
          message: 'Authentication required' 
        };
      }
      
      // Ensure the sender ID matches the client's user ID
      if (wsClient.userId !== messageData.senderId) {
        return { 
          status: 'error', 
          message: 'Sender ID does not match authenticated user' 
        };
      }
      
      // Prepare message data
      const insertMessage: InsertMessage = {
        sender_id: messageData.senderId,
        content: messageData.content,
        is_read: false,
        created_at: new Date(),
        ...(messageData.receiverId && { receiver_id: messageData.receiverId }),
        ...(messageData.orderId && { order_id: messageData.orderId }),
        ...(messageData.attachmentUrl && { attachment_url: messageData.attachmentUrl }),
      };
      
      // Save message to database
      const savedMessage = await this.chatService.createMessage(insertMessage);
      
      // Get message with user details
      const messageWithDetails = await this.chatService.getMessageWithDetails(savedMessage.id);
      
      // Send message to receiver if they're connected
      if (messageData.receiverId) {
        this.sendToUser(messageData.receiverId, 'new_message', messageWithDetails);
      } else if (messageData.orderId) {
        // If it's an order message, find all users involved in that order
        // This is a placeholder for actual order service integration
        this.broadcastToOrderParticipants(messageData.orderId, 'new_message', messageWithDetails);
      }
      
      return { 
        status: 'success', 
        message: messageWithDetails 
      };
    } catch (error) {
      console.error('Send message error:', error);
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }

  @SubscribeMessage('read_message')
  async handleReadMessage(
    @ConnectedSocket() client: any,
    @MessageBody() data: { messageId: number }
  ) {
    const wsClient = client as ExtendedWebSocket;
    try {
      // Verify user is authenticated
      if (!wsClient.userId) {
        return { status: 'error', message: 'Authentication required' };
      }
      
      // Mark message as read
      const updatedMessage = await this.chatService.markMessageAsRead(data.messageId);
      
      // Notify the message sender
      this.sendToUser(updatedMessage.sender_id, 'message_read', {
        messageId: updatedMessage.id,
        readBy: wsClient.userId,
      });
      
      return { status: 'success', message: updatedMessage };
    } catch (error) {
      console.error('Read message error:', error);
      return { status: 'error', message: error.message };
    }
  }

  private sendToUser(userId: number, event: string, data: any) {
    const clients = this.connectedClients.get(userId);
    if (clients && clients.length > 0) {
      const messageStr = JSON.stringify({ event, data });
      
      clients.forEach(client => {
        if (client.readyState === WS_OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  private broadcastToOrderParticipants(orderId: number, event: string, data: any) {
    // This is a simplified implementation - in a real app, we would need to query
    // the order service to get all participants (customer, pharmacy, delivery person)
    // For now, we'll just broadcast to everyone
    this.broadcastToAll(event, data);
  }

  private broadcastToAll(event: string, data: any) {
    const messageStr = JSON.stringify({ event, data });
    
    this.connectedClients.forEach((clients) => {
      clients.forEach(client => {
        if (client.readyState === WS_OPEN) {
          client.send(messageStr);
        }
      });
    });
  }

  private removeClient(userId: number, client: ExtendedWebSocket) {
    const clients = this.connectedClients.get(userId);
    if (clients) {
      const index = clients.indexOf(client);
      if (index !== -1) {
        clients.splice(index, 1);
      }
      
      if (clients.length === 0) {
        this.connectedClients.delete(userId);
      }
    }
  }

  private pingClients() {
    this.connectedClients.forEach((clients) => {
      clients.forEach((client) => {
        if (client.isAlive === false) {
          client.terminate();
          return;
        }
        
        client.isAlive = false;
        client.ping();
      });
    });
  }

  onModuleDestroy() {
    clearInterval(this.pingInterval);
  }
}