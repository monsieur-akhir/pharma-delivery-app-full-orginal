import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { 
  NotificationJob, 
  EmailNotificationJob, 
  SmsNotificationJob, 
  PushNotificationJob, 
  MultiChannelNotificationJob 
} from './processors/notification.processor';
import { OcrJob } from './processors/ocr.processor';
import { PrescriptionAnalysisJob } from './processors/prescription-analysis.processor';

@Injectable()
export class BullService {
  private readonly logger = new Logger(BullService.name);

  constructor(
    @InjectQueue('ocr') private readonly ocrQueue: Queue<OcrJob>,
    @InjectQueue('prescription-analysis') private readonly prescriptionAnalysisQueue: Queue<PrescriptionAnalysisJob>,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue<NotificationJob>,
  ) {}

  // OCR Queue Methods
  async addOcrJob(
    job: OcrJob,
    options?: { priority?: number; delay?: number; attempts?: number; }
  ): Promise<string> {
    this.logger.log(`Adding OCR job for prescription ${job.prescriptionId}`);
    
    const queuedJob = await this.ocrQueue.add(job, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    });
    
    return queuedJob.id.toString();
  }

  // Prescription Analysis Queue Methods
  async addPrescriptionAnalysisJob(
    job: PrescriptionAnalysisJob,
    options?: { priority?: number; delay?: number; attempts?: number; }
  ): Promise<string> {
    this.logger.log(`Adding prescription analysis job for prescription ${job.prescriptionId}`);
    
    const queuedJob = await this.prescriptionAnalysisQueue.add(job, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    });
    
    return queuedJob.id.toString();
  }

  // Notification Queue Methods - Email
  async sendEmailNotification(
    notification: Omit<EmailNotificationJob, 'type'>,
    options?: { priority?: number; delay?: number; }
  ): Promise<string> {
    const job: EmailNotificationJob = {
      ...notification,
      type: 'email',
    };
    
    this.logger.log(`Adding email notification job for ${job.email}`);
    
    const queuedJob = await this.notificationsQueue.add(job, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    });
    
    return queuedJob.id.toString();
  }

  // Notification Queue Methods - SMS
  async sendSmsNotification(
    notification: Omit<SmsNotificationJob, 'type'>,
    options?: { priority?: number; delay?: number; }
  ): Promise<string> {
    const job: SmsNotificationJob = {
      ...notification,
      type: 'sms',
    };
    
    this.logger.log(`Adding SMS notification job for ${job.phone}`);
    
    const queuedJob = await this.notificationsQueue.add(job, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    });
    
    return queuedJob.id.toString();
  }

  // Notification Queue Methods - Push
  async sendPushNotification(
    notification: Omit<PushNotificationJob, 'type'>,
    options?: { priority?: number; delay?: number; }
  ): Promise<string> {
    const job: PushNotificationJob = {
      ...notification,
      type: 'push',
    };
    
    this.logger.log(`Adding push notification job for user ${job.userId}`);
    
    const queuedJob = await this.notificationsQueue.add(job, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    });
    
    return queuedJob.id.toString();
  }

  // Notification Queue Methods - Multi-Channel
  async sendMultiChannelNotification(
    notification: Omit<MultiChannelNotificationJob, 'type'>,
    options?: { priority?: number; delay?: number; }
  ): Promise<string> {
    const job: MultiChannelNotificationJob = {
      ...notification,
      type: 'multi',
    };
    
    this.logger.log(`Adding multi-channel notification job for user ${job.userId}`);
    
    const queuedJob = await this.notificationsQueue.add(job, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    });
    
    return queuedJob.id.toString();
  }

  // Queue Management Methods
  async getQueueCounts(): Promise<{ [key: string]: { waiting: number; active: number; completed: number; failed: number; } }> {
    const [ocrCounts, prescriptionAnalysisCounts, notificationsCounts] = await Promise.all([
      this.ocrQueue.getJobCounts(),
      this.prescriptionAnalysisQueue.getJobCounts(),
      this.notificationsQueue.getJobCounts(),
    ]);
    
    return {
      ocr: ocrCounts,
      prescriptionAnalysis: prescriptionAnalysisCounts,
      notifications: notificationsCounts,
    };
  }

  async cleanQueues(olderThan: number = 24 * 60 * 60 * 1000): Promise<{ [key: string]: number }> {
    // Clean jobs older than the specified time (default: 24 hours)
    const timestamp = Date.now() - olderThan;
    
    const [ocrResult, prescriptionAnalysisResult, notificationsResult] = await Promise.all([
      this.ocrQueue.clean(timestamp, 'completed'),
      this.prescriptionAnalysisQueue.clean(timestamp, 'completed'),
      this.notificationsQueue.clean(timestamp, 'completed'),
    ]);
    
    return {
      ocr: ocrResult.length,
      prescriptionAnalysis: prescriptionAnalysisResult.length,
      notifications: notificationsResult.length,
    };
  }
}