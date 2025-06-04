import { Module, forwardRef } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { RedisModule } from '../redis/redis.module';
import { LocationGateway } from './location.gateway';
import { BullModule } from '@nestjs/bull';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { BullQueueModule } from '../bull/bull-queue.module'; // Ajout important

@Module({
  imports: [
    RedisModule,
    BullModule.registerQueue({
      name: 'location-queue',
    }),
    PrescriptionsModule, // Import direct car nous avons besoin de OcrService
    forwardRef(() => BullQueueModule) // Garde la référence circulaire seulement où nécessaire
  ],
  controllers: [LocationController],
  providers: [LocationService, LocationGateway],
  exports: [LocationService],
})
export class LocationModule {}