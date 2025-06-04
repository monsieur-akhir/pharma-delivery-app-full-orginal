import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoService } from './services/brevo.service';
import { DatabaseService } from '../database/database.service';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationFilterDto,
  SendNotificationDto,
  NotificationPreferencesDto,
} from './dto';
import { NotificationType } from './dto/notification-types.enum';
import { NotificationPriority } from './dto/notification-priority.enum';
import { NotificationChannel } from './dto/send-notification.dto';

interface NotificationLog {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  template?: string;
  data?: any;
  success: boolean;
  error?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly brevoService: BrevoService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Find all notifications for a user with filters
   */
  async findAll(filterDto: NotificationFilterDto, user: any): Promise<NotificationResponseDto[]> {
    try {
      this.logger.log(`Getting notifications for user ${user.id} with filters: ${JSON.stringify(filterDto)}`);
      
      // In a real implementation, this would query the database
      // For now, return sample data
      return this.getSampleNotifications(user.id);
    } catch (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`);
      return [];
    }
  }

  /**
   * Get count of unread notifications for a user
   */
  async getUnreadCount(user: any): Promise<{ count: number }> {
    try {
      // In a real implementation, query the database
      return { count: 3 }; // Sample data
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`);
      return { count: 0 };
    }
  }

  /**
   * Get all notification types
   */
  async getNotificationTypes(): Promise<string[]> {
    return Object.values(NotificationType);
  }

  /**
   * Find a notification by ID
   */
  async findOne(id: number, user: any): Promise<NotificationResponseDto> {
    try {
      const notifications = this.getSampleNotifications(user.id);
      const notification = notifications.find(n => n.id === id);
      
      if (!notification) {
        throw new NotFoundException('Notification not found');
      }
      
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch notification: ${error.message}`);
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Create a new notification
   */
  async create(createDto: CreateNotificationDto, user: any): Promise<NotificationResponseDto> {
    try {
      this.logger.log(`Creating notification: ${JSON.stringify(createDto)}`);
      
      // In a real implementation, save to database
      const notification = new NotificationResponseDto();
      notification.id = Math.floor(Math.random() * 1000);
      notification.title = createDto.title;
      notification.content = createDto.content;
      notification.type = createDto.type;
      notification.priority = createDto.priority;
      notification.read = false;
      notification.actionable = createDto.actionable || false;
      notification.actions = createDto.actions;
      notification.timestamp = new Date();
      
      if (createDto.entityId) {
        notification.entityId = createDto.entityId;
      }
      
      if (createDto.entityType) {
        notification.entityType = createDto.entityType;
      }
      
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw new BadRequestException('Failed to create notification');
    }
  }

  /**
   * Send notification to users
   */
  async sendNotification(sendDto: SendNotificationDto, user: any): Promise<{ success: boolean; count: number }> {
    try {
      this.logger.log(`Sending notification: ${JSON.stringify(sendDto)}`);
      
      // Determine recipients
      let recipientIds: number[] = [];
      
      switch (sendDto.recipientType) {
        case 'all':
          // In production, this would query all user IDs
          recipientIds = [1, 2, 3, 4, 5]; // Sample data
          break;
          
        case 'role':
          if (!sendDto.role) {
            throw new BadRequestException('Role must be specified when recipientType is "role"');
          }
          // In production, query users with this role
          recipientIds = [2, 3]; // Sample data
          break;
          
        case 'pharmacy':
          if (!sendDto.pharmacyId) {
            throw new BadRequestException('Pharmacy ID must be specified when recipientType is "pharmacy"');
          }
          // In production, query pharmacy staff
          recipientIds = [4, 5]; // Sample data
          break;
          
        case 'users':
          if (!sendDto.userIds || sendDto.userIds.length === 0) {
            throw new BadRequestException('User IDs must be specified when recipientType is "users"');
          }
          recipientIds = sendDto.userIds;
          break;
          
        default:
          throw new BadRequestException('Invalid recipient type');
      }
      
      // Process each channel
      for (const channel of sendDto.channels) {
        switch (channel) {
          case NotificationChannel.EMAIL:
            // Send emails
            if (sendDto.emailTemplate) {
              // In production, query user emails and send
              this.logger.log(`Would send email to ${recipientIds.length} users using template ${sendDto.emailTemplate}`);
            }
            break;
            
          case NotificationChannel.SMS:
            // Send SMS
            if (sendDto.smsTemplate) {
              this.logger.log(`Would send SMS to ${recipientIds.length} users using template ${sendDto.smsTemplate}`);
            }
            break;
            
          case NotificationChannel.PUSH:
            // Send push notifications
            this.logger.log(`Would send push notifications to ${recipientIds.length} users`);
            break;
            
          case NotificationChannel.APP:
            // Create in-app notifications
            this.logger.log(`Would create in-app notifications for ${recipientIds.length} users`);
            break;
            
          case NotificationChannel.ALL:
            this.logger.log(`Would send via all available channels to ${recipientIds.length} users`);
            break;
        }
      }
      
      return { success: true, count: recipientIds.length };
    } catch (error) {
      this.logger.error(`Failed to send notifications: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to send notifications');
    }
  }

  /**
   * Update a notification
   */
  async update(id: number, updateDto: UpdateNotificationDto, user: any): Promise<NotificationResponseDto> {
    try {
      const notification = await this.findOne(id, user);
      
      // Update fields
      if (updateDto.title !== undefined) {
        notification.title = updateDto.title;
      }
      
      if (updateDto.content !== undefined) {
        notification.content = updateDto.content;
      }
      
      if (updateDto.type !== undefined) {
        notification.type = updateDto.type;
      }
      
      if (updateDto.priority !== undefined) {
        notification.priority = updateDto.priority;
      }
      
      this.logger.log(`Updated notification ${id}`);
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update notification: ${error.message}`);
      throw new BadRequestException('Failed to update notification');
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number, user: any): Promise<NotificationResponseDto> {
    try {
      const notification = await this.findOne(id, user);
      notification.read = true;
      
      this.logger.log(`Marked notification ${id} as read`);
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(user: any): Promise<{ success: boolean; count: number }> {
    try {
      // In production, update database
      this.logger.log(`Marked all notifications as read for user ${user.id}`);
      return { success: true, count: 3 }; // Sample data
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`);
      return { success: false, count: 0 };
    }
  }

  /**
   * Delete a notification
   */
  async remove(id: number, user: any): Promise<{ success: boolean }> {
    try {
      // First check if notification exists
      await this.findOne(id, user);
      
      // In production, delete from database
      this.logger.log(`Removed notification ${id}`);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(user: any): Promise<NotificationPreferencesDto> {
    try {
      // In production, fetch from database
      // Return default preferences for now
      const preferences = new NotificationPreferencesDto();
      
      preferences.enabled = true;
      
      preferences.channels = {
        email: true,
        sms: false,
        push: true,
        app: true
      };
      
      preferences.types = {
        order: true,
        system: true,
        pharmacy: true,
        alert: true,
        user: true,
        payment: true,
        delivery: true,
        prescription: true,
        medicine: true,
        reminder: true
      };
      
      preferences.priorityChannels = {
        urgent: NotificationChannel.ALL,
        high: NotificationChannel.APP,
        medium: NotificationChannel.APP,
        low: NotificationChannel.APP
      };
      
      preferences.quietHoursEnabled = false;
      preferences.quietHoursStart = '22:00';
      preferences.quietHoursEnd = '08:00';
      preferences.customSettings = {};
      
      return preferences;
    } catch (error) {
      this.logger.error(`Failed to get notification preferences: ${error.message}`);
      // Return default preferences on error
      const preferences = new NotificationPreferencesDto();
      
      preferences.enabled = true;
      
      preferences.channels = {
        email: true,
        sms: false,
        push: true,
        app: true
      };
      
      preferences.types = {
        order: true,
        system: true,
        pharmacy: true,
        alert: true,
        user: true,
        payment: true,
        delivery: true,
        prescription: true,
        medicine: true,
        reminder: true
      };
      
      preferences.priorityChannels = {
        urgent: NotificationChannel.ALL,
        high: NotificationChannel.APP,
        medium: NotificationChannel.APP,
        low: NotificationChannel.APP
      };
      
      preferences.quietHoursEnabled = false;
      preferences.quietHoursStart = '22:00';
      preferences.quietHoursEnd = '08:00';
      preferences.customSettings = {};
      
      return preferences;
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(preferencesDto: NotificationPreferencesDto, user: any): Promise<NotificationPreferencesDto> {
    try {
      // In production, update database
      this.logger.log(`Updated notification preferences for user ${user.id}`);
      return preferencesDto;
    } catch (error) {
      this.logger.error(`Failed to update notification preferences: ${error.message}`);
      throw new BadRequestException('Failed to update notification preferences');
    }
  }

  /**
   * Send an email notification
   */
  async sendEmail(to: string, subject: string, template: string, data: any, fallbackTemplate?: string): Promise<boolean> {
    try {
      // Use Brevo service
      const result = await this.brevoService.sendEmail(to, subject, template, data, fallbackTemplate);
      
      // Log the notification to the database for tracking
      await this.logNotification({
        type: 'email',
        recipient: to,
        template,
        data,
        success: result.success,
        error: result.error,
      });
      
      return result.success;
    } catch (error) {
      this.logger.error(`Failed to send email notification to ${to}: ${error.message}`);
      
      await this.logNotification({
        type: 'email',
        recipient: to,
        template,
        data,
        success: false,
        error: error.message,
      });
      
      return false;
    }
  }

  /**
   * Send an SMS notification
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      // Use Brevo service
      const result = await this.brevoService.sendSms(to, message);
      
      // Log the notification to the database for tracking
      await this.logNotification({
        type: 'sms',
        recipient: to,
        data: { message },
        success: result.success,
        error: result.error,
      });
      
      return result.success;
    } catch (error) {
      this.logger.error(`Failed to send SMS notification to ${to}: ${error.message}`);
      
      await this.logNotification({
        type: 'sms',
        recipient: to,
        data: { message },
        success: false,
        error: error.message,
      });
      
      return false;
    }
  }

  /**
   * Send a push notification
   */
  async sendPush(userId: number, title: string, body: string, data?: any): Promise<boolean> {
    try {
      // In a production implementation, this would use FCM, APNS, or another push service
      // Here we just log it
      this.logger.log(`Would send push notification to user ${userId}: ${title} - ${body}`);
      
      // Log the notification to the database for tracking
      await this.logNotification({
        type: 'push',
        recipient: userId.toString(),
        data: { title, body, data },
        success: true,
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${userId}: ${error.message}`);
      
      await this.logNotification({
        type: 'push',
        recipient: userId.toString(),
        data: { title, body, data },
        success: false,
        error: error.message,
      });
      
      return false;
    }
  }

  /**
   * Send a push notification via Firebase Cloud Messaging or similar service
   */
  async sendPushNotification(options: { 
    token: string; 
    title: string; 
    body: string; 
    data?: Record<string, any>;
  }): Promise<boolean> {
    try {
      const { token, title, body, data } = options;
      
      // In a production environment, this would use Firebase Admin SDK or similar
      this.logger.log(`Sending push notification to device ${token}: ${title} - ${body}`);
      
      // Log the notification
      await this.logNotification({
        type: 'push',
        recipient: token,
        data: { title, body, data },
        success: true,
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      
      await this.logNotification({
        type: 'push',
        recipient: options.token,
        data: { title: options.title, body: options.body, data: options.data },
        success: false,
        error: error.message,
      });
      
      return false;
    }
  }

  /**
   * Log notification details to the database
   */
  private async logNotification(notificationLog: NotificationLog): Promise<void> {
    try {
      // Store the notification in the database
      await this.databaseService.query(
        `INSERT INTO system_logs 
         (type, message, data, created_at, entity, entity_type, action) 
         VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
        [
          'notification',
          `${notificationLog.type.toUpperCase()} to ${notificationLog.recipient}`,
          JSON.stringify({
            type: notificationLog.type,
            recipient: notificationLog.recipient,
            template: notificationLog.template,
            data: notificationLog.data,
            success: notificationLog.success,
            error: notificationLog.error,
          }),
          'notification',
          'notification',
          `SEND_${notificationLog.type.toUpperCase()}`
        ]
      );
    } catch (error) {
      this.logger.error(`Failed to log notification: ${error.message}`);
      // We don't rethrow here to prevent notification failure just because logging failed
    }
  }

  /**
   * Send notification through multiple channels based on user preferences
   */
  async sendMultiChannelNotification(
    userId: number,
    email: string,
    phone: string,
    title: string,
    message: string,
    templateName: string,
    data: any,
    channels: ('email' | 'sms' | 'push')[] = ['email']
  ): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    // Send through each requested channel
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            if (email) {
              results.email = await this.sendEmail(email, title, templateName, data);
            }
            break;
            
          case 'sms':
            if (phone) {
              results.sms = await this.sendSms(phone, message);
            }
            break;
            
          case 'push':
            results.push = await this.sendPush(userId, title, message, data);
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send ${channel} notification: ${error.message}`);
        results[channel] = false;
      }
    }
    
    return results;
  }

  /**
   * Generate sample notifications for development
   */
  private getSampleNotifications(userId: number): NotificationResponseDto[] {
    const notifications: NotificationResponseDto[] = [];
    
    // Sample notification 1
    const notification1 = new NotificationResponseDto();
    notification1.id = 1;
    notification1.title = "New Order Received";
    notification1.content = "You have received a new order #ORD-12345";
    notification1.type = NotificationType.ORDER;
    notification1.timestamp = new Date();
    notification1.read = false;
    notification1.priority = NotificationPriority.HIGH;
    notification1.actionable = true;
    notification1.entityId = 12345;
    notification1.entityType = "order";
    notifications.push(notification1);
    
    // Sample notification 2
    const notification2 = new NotificationResponseDto();
    notification2.id = 2;
    notification2.title = "Delivery Update";
    notification2.content = "Your order #ORD-12345 is out for delivery";
    notification2.type = NotificationType.DELIVERY;
    notification2.timestamp = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    notification2.read = true;
    notification2.priority = NotificationPriority.MEDIUM;
    notification2.actionable = false;
    notification2.entityId = 12345;
    notification2.entityType = "order";
    notifications.push(notification2);
    
    // Sample notification 3
    const notification3 = new NotificationResponseDto();
    notification3.id = 3;
    notification3.title = "Password Changed";
    notification3.content = "Your account password was updated successfully";
    notification3.type = NotificationType.SYSTEM;
    notification3.timestamp = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    notification3.read = false;
    notification3.priority = NotificationPriority.LOW;
    notification3.actionable = false;
    notifications.push(notification3);
    
    return notifications;
  }
}