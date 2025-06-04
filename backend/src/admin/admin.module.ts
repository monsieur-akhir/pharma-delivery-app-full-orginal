import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemLogsController } from './system-logs/system-logs.controller';
import { SystemLogsService } from './system-logs/system-logs.service';
import { PharmacyValidationController } from './pharmacy-validation/pharmacy-validation.controller';
import { PharmacyValidationService } from './pharmacy-validation/pharmacy-validation.service';
import { AiSettingsController } from './ai-settings/ai-settings.controller';
import { AiSettingsService } from './ai-settings/ai-settings.service';
import { UserManagementController } from './user-management/user-management.controller';
import { UserManagementService } from './user-management/user-management.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { PermissionsController } from './permissions/permissions.controller';
import { PermissionsService } from './permissions/permissions.service';
import { TokenBlacklistService } from './auth/services/token-blacklist.service';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { RedisModule } from '../redis/redis.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => PrescriptionsModule), // Gestion des dépendances circulaires
    NotificationsModule,
    RedisModule, // Added Redis for TokenBlacklistService
    DashboardModule, // Dashboard module for admin statistics
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'medconnect-dev-secret',
      signOptions: { expiresIn: '1h' }, // 1 heure pour le token, avec refresh automatique
    }),
  ],
  controllers: [
    AdminController,
    SystemLogsController,
    PharmacyValidationController,
    AiSettingsController,
    UserManagementController,
    AdminAuthController,
    PermissionsController,
    // Retirez PrescriptionsController - il doit être dans son propre module
  ],
  providers: [
    AdminService,
    SystemLogsService,
    PharmacyValidationService,
    AiSettingsService,
    UserManagementService,
    AdminAuthService,
    PermissionsService,
    TokenBlacklistService,
  ],
  exports: [
    AdminService,
    SystemLogsService,
    PharmacyValidationService,
    AiSettingsService,
    UserManagementService,
    AdminAuthService,
    PermissionsService,
  ],
})
export class AdminModule {}