// queue.service.ts
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('ocr') public readonly ocrQueue: Queue,
    @InjectQueue('prescription-analysis') public readonly prescriptionQueue: Queue,
    @InjectQueue('notifications') public readonly notificationQueue: Queue,
  ) {}
}