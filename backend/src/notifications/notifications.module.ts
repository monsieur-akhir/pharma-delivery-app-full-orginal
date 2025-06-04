import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { BrevoService } from './services/brevo.service';
import { DatabaseModule } from '../database/database.module';
import { PrescriptionsModule } from './../prescriptions/prescriptions.module';

@Module({
  imports: [
    DatabaseModule,
       forwardRef(() => PrescriptionsModule) // Gestion des dépendances circulaires
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    BrevoService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}