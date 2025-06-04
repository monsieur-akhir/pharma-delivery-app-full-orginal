import { Module } from '@nestjs/common';
import { DeliveryTrackingService } from './delivery-tracking.service';
import { DeliveryTrackingController } from './delivery-tracking.controller';
import { DeliveryTrackingGateway } from './delivery-tracking.gateway';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { config } from '../config';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: config.security.jwt.secret,
      signOptions: { expiresIn: config.security.jwt.expiresIn },
    }),
  ],
  providers: [DeliveryTrackingService, DeliveryTrackingGateway],
  controllers: [DeliveryTrackingController],
  exports: [DeliveryTrackingService],
})
export class DeliveryTrackingModule {}