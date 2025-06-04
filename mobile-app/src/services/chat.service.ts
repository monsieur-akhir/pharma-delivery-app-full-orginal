import api from './api.service';
import io from 'socket.io-client';
import { API_URL } from '../config';
import { store } from '../store';

/**
 * Interface for chat message
 */
export interface Message {
  id: number;
  senderId: number;
  receiverId?: number;
  orderId?: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  senderName?: string;
  senderAvatar?: string;
}

/**
 * Service for handling chat functionality
 */
class ChatService {
  private socket: any;
  private onMessageCallbacks: ((message: Message) => void)[] = [];
  private onReadCallbacks: ((messageId: number) => void)[] = [];

  /**
   * Initialize socket connection for chat
   */
  initializeSocket() {
    if (!this.socket) {
      this.socket = io(`${API_URL}`, {
        path: '/chat-socket',
        auth: {
          token: store.getState().auth.token
        },
        transports: ['websocket']
      });

      this.setupSocketListeners();
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected for chat');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected from chat');
    });

    this.socket.on('message', (message: Message) => {
      this.onMessageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('message-read', (messageId: number) => {
      this.onReadCallbacks.forEach(callback => callback(messageId));
    });
  }

  /**
   * Get user's messages
   */
  async getUserMessages() {
    try {
      const response = await api.get('/chat/messages');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get conversation with another user
   * @param userId Other user's ID
   */
  async getConversation(userId: number) {
    try {
      const response = await api.get(`/chat/conversation/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get messages for a specific order
   * @param orderId Order ID
   */
  async getOrderMessages(orderId: number) {
    try {
      const response = await api.get(`/chat/order/${orderId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a message to another user
   * @param receiverId Recipient user ID
   * @param content Message content
   */
  async sendMessage(receiverId: number, content: string) {
    this.initializeSocket();
    
    try {
      const response = await api.post('/chat/message', {
        receiverId,
        content
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a message related to an order
   * @param orderId Order ID
   * @param content Message content
   */
  async sendOrderMessage(orderId: number, content: string) {
    this.initializeSocket();
    
    try {
      const response = await api.post('/chat/order-message', {
        orderId,
        content
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark a message as read
   * @param messageId Message ID
   */
  async markMessageAsRead(messageId: number) {
    this.initializeSocket();
    
    try {
      const response = await api.post(`/chat/message/${messageId}/read`);
      
      // Emit the message-read event to the server
      this.socket.emit('read-message', messageId);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get count of unread messages
   */
  async getUnreadMessageCount() {
    try {
      const response = await api.get('/chat/unread-count');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add callback for when a new message is received
   * @param callback Function to call with the new message
   */
  onMessage(callback: (message: Message) => void) {
    this.initializeSocket();
    this.onMessageCallbacks.push(callback);
  }

  /**
   * Add callback for when a message is read
   * @param callback Function to call with the read message ID
   */
  onMessageRead(callback: (messageId: number) => void) {
    this.initializeSocket();
    this.onReadCallbacks.push(callback);
  }

  /**
   * Remove a message callback
   * @param callback Callback to remove
   */
  removeMessageCallback(callback: (message: Message) => void) {
    this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Remove a message read callback
   * @param callback Callback to remove
   */
  removeMessageReadCallback(callback: (messageId: number) => void) {
    this.onReadCallbacks = this.onReadCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Disconnect from the chat socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new ChatService();