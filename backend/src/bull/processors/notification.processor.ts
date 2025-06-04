import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../../notifications/notifications.service';

export interface EmailNotificationJob {
  type: 'email';
  userId: number;
  email: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface SmsNotificationJob {
  type: 'sms';
  userId: number;
  phone: string;
  message: string;
}

export interface PushNotificationJob {
  type: 'push';
  userId: number;
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface MultiChannelNotificationJob {
  type: 'multi';
  userId: number;
  channels: {
    email?: Omit<EmailNotificationJob, 'type' | 'userId'>;
    sms?: Omit<SmsNotificationJob, 'type' | 'userId'>;
    push?: Omit<PushNotificationJob, 'type' | 'userId'>;
  };
}

export type NotificationJob =
  | EmailNotificationJob
  | SmsNotificationJob
  | PushNotificationJob
  | MultiChannelNotificationJob;

@Injectable()
@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('send-notification')
  async processNotification(job: Job<NotificationJob>): Promise<boolean> {
    const { id } = job;
    const data: NotificationJob = job.data;
    this.logger.log(`Processing notification job #${id}`);
    try {
      if (!data || !data.type || !data.userId) {
        throw new Error('Invalid notification job data');
      }
      switch (data.type) {
        case 'email':
          return await this.processEmailNotification(data);
        case 'sms':
          return await this.processSmsNotification(data);
        case 'push':
          return await this.processPushNotification(data);
        case 'multi':
          return await this.processMultiChannelNotification(data);
        default:
          this.logger.error(`Unknown notification type: ${data}`);
          throw new Error(`Unknown notification type`);
      }
    } catch (error) {
      this.logger.error(`Failed to process notification: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Process an email notification job
   */
  private async processEmailNotification(data: EmailNotificationJob): Promise<boolean> {
    this.logger.log(`Sending email notification to user #${data.userId} (${data.email})`);
    try {
      const { email, subject, template, data: templateData } = data;
      if (!email || !subject || !template) {
        throw new Error('Missing required email notification parameters');
      }
      // Send email via notification service
      await this.notificationsService.sendEmail(email, subject, template, templateData);
      this.logger.log(`Successfully sent email to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process an SMS notification job
   */
  private async processSmsNotification(data: SmsNotificationJob): Promise<boolean> {
    this.logger.log(`Sending SMS notification to user #${data.userId} (${data.phone})`);
    try {
      const { phone, message } = data;
      if (!phone || !message) {
        throw new Error('Missing required SMS notification parameters');
      }
      await this.notificationsService.sendSms(phone, message);
      this.logger.log(`Successfully sent SMS to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process a push notification job
   */
  private async processPushNotification(data: PushNotificationJob): Promise<boolean> {
    this.logger.log(`Sending push notification to user #${data.userId}`);
    
    try {
      const { deviceToken, title, body, data: pushData } = data;
      
      // Validate push notification data
      if (!deviceToken || !title || !body) {
        throw new Error('Missing required push notification parameters');
      }
      
      // Send push notification via notification service
      await this.notificationsService.sendPushNotification({
        token: deviceToken,
        title,
        body,
        data: pushData || {},
      });
      
      this.logger.log(`Successfully sent push notification to device ${deviceToken}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process a multi-channel notification job
   */
  private async processMultiChannelNotification(data: MultiChannelNotificationJob): Promise<boolean> {
    this.logger.log(`Sending multi-channel notification to user #${data.userId}`);
    
    try {
      const { userId, channels } = data;
      
      // Validate channels data
      if (!channels || Object.keys(channels).length === 0) {
        throw new Error('No notification channels specified');
      }
      
      const results: boolean[] = [];
      
      // Process email channel
      if (channels.email) {
        try {
          const emailResult = await this.processEmailNotification({
            type: 'email',
            userId,
            email: channels.email.email,
            subject: channels.email.subject,
            template: channels.email.template,
            data: channels.email.data || {},
          });
          results.push(emailResult);
        } catch (error) {
          this.logger.error(`Failed to send email in multi-channel notification: ${error.message}`);
          results.push(false);
        }
      }
      
      // Process SMS channel
      if (channels.sms) {
        try {
          const smsResult = await this.processSmsNotification({
            type: 'sms',
            userId,
            phone: channels.sms.phone,
            message: channels.sms.message,
          });
          results.push(smsResult);
        } catch (error) {
          this.logger.error(`Failed to send SMS in multi-channel notification: ${error.message}`, error.stack);
          results.push(false);
        }
      }
      
      // Process push channel
      if (channels.push) {
        try {
          const pushResult = await this.processPushNotification({
            type: 'push',
            userId,
            deviceToken: channels.push.deviceToken,
            title: channels.push.title,
            body: channels.push.body,
            data: channels.push.data,
          });
          results.push(pushResult);
        } catch (error) {
          this.logger.error(`Failed to send push notification in multi-channel notification: ${error.message}`, error.stack);
          results.push(false);
        }
      }
      
      // Return true if at least one channel succeeded
      const overallResult = results.some(r => r === true);
      if (overallResult) {
        this.logger.log(`Successfully sent at least one notification to user #${userId}`);
      } else {
        this.logger.error(`Failed to send any notifications to user #${userId}`);
        throw new Error('All notification channels failed');
      }
      
      return overallResult;
    } catch (error) {
      this.logger.error(`Failed to process multi-channel notification: ${error.message}`);
      throw error;
    }
  }
}