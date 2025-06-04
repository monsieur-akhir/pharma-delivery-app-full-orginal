import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, and, or, desc } from 'drizzle-orm';
import { 
  messages, 
  type Message,
  type InsertMessage,
  users
} from '../../../shared/schema';

@Injectable()
export class ChatService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [newMessage] = await this.databaseService.db
      .insert(messages)
      .values({
        ...messageData,
        is_read: false,
        created_at: new Date(),
      })
      .returning();
    
    return newMessage;
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return this.databaseService.db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.sender_id, userId),
          eq(messages.receiver_id, userId)
        )
      )
      .orderBy(messages.created_at);
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return this.databaseService.db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.sender_id, userId1),
            eq(messages.receiver_id, userId2)
          ),
          and(
            eq(messages.sender_id, userId2),
            eq(messages.receiver_id, userId1)
          )
        )
      )
      .orderBy(messages.created_at);
  }

  async getOrderMessages(orderId: number): Promise<Message[]> {
    return this.databaseService.db
      .select()
      .from(messages)
      .where(eq(messages.order_id, orderId))
      .orderBy(messages.created_at);
  }

  async getMessageWithDetails(messageId: number) {
    const [message] = await this.databaseService.db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
    
    if (!message) {
      return null;
    }

    // Get sender info
    const [sender] = await this.databaseService.db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        profile_image: users.profile_image,
      })
      .from(users)
      .where(eq(users.id, message.sender_id));
    
    // Get receiver info if exists
    let receiver = null;
    if (message.receiver_id) {
      const [receiverData] = await this.databaseService.db
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
          profile_image: users.profile_image,
        })
        .from(users)
        .where(eq(users.id, message.receiver_id));
      
      receiver = receiverData;
    }

    return {
      ...message,
      sender,
      receiver,
    };
  }

  async markMessageAsRead(messageId: number): Promise<Message> {
    const [updatedMessage] = await this.databaseService.db
      .update(messages)
      .set({ is_read: true })
      .where(eq(messages.id, messageId))
      .returning();
    
    return updatedMessage;
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const unreadMessages = await this.databaseService.db
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.receiver_id, userId),
          eq(messages.is_read, false)
        )
      );
    
    return unreadMessages.length;
  }
}