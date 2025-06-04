// src/bull/bull.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { BullService } from './bull.service';
import { OcrProcessor } from './processors/ocr.processor';
import { PrescriptionAnalysisProcessor } from './processors/prescription-analysis.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // Enregistrement des queues
    BullModule.registerQueue(
      {
        name: 'ocr',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      },
      {
        name: 'prescription-analysis',  // <== même nom ici
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      },
      {
        name: 'notifications',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      },
    ),

    // Modules importés (avec forwardRef pour éviter les boucles)
    forwardRef(() => PrescriptionsModule),
    NotificationsModule,
    UsersModule,
  ],
  providers: [
    BullService,
    OcrProcessor,
    PrescriptionAnalysisProcessor,
    NotificationProcessor,
  ],
  exports: [BullService, BullModule],
})
export class BullQueueModule {
  constructor(private readonly configService: ConfigService) {}
}
