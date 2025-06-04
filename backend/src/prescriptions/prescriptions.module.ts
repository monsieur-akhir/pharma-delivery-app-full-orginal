// src/prescriptions/prescriptions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { DatabaseModule } from '../database/database.module';
import { BullQueueModule } from '../bull/bull-queue.module';
import { OcrService } from './services/ocr.service';

@Module({
  imports: [
    DatabaseModule,
    // wrappe BullQueueModule pour rompre le cycle
     forwardRef(() => BullQueueModule),

  ],
  providers: [PrescriptionsService, OcrService],
  exports: [PrescriptionsService, OcrService],
})
export class PrescriptionsModule {
  constructor() {
    console.log('PrescriptionsModule initialized');
  }
}
