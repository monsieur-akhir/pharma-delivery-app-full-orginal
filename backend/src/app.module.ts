import { Module, MiddlewareConsumer, RequestMethod, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger/logger.module';
import { RedisModule } from './redis/redis.module';
import { LocationModule } from './location/location.module';
import { PharmaciesModule } from './pharmacies/pharmacies.module';
import { AdminModule } from './admin/admin.module';
import { PharmacyStatsModule } from './admin/pharmacy-stats/pharmacy-stats.module';
import { StatsModule } from './stats/stats.module';
import { PharmacyStatisticsModule } from './pharmacy-statistics/pharmacy-statistics.module';
import { StatisticsController } from './controllers/statistics.controller';
import { AuditMiddleware } from './middleware/audit.middleware';
import { LoggerService } from './logger/logger.service';
import { DatabaseModule } from './database/database.module';
import { PharmacyStatsController } from './pharmacy-stats.controller';
import { StatsEndpointController } from './stats-endpoint.controller';
import { PharmacyStatisticsEndpointController } from './controllers/pharmacy-statistics.controller';
import { DirectStatsController } from './controllers/pharmacy-stats-direct.controller';
import { PharmacyStatisticsRootController } from './pharmacy-statistics.controller';
import { PharmacyStatsModuleModule } from './pharmacy-stats-module/pharmacy-stats.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { BullQueueModule } from './bull/bull-queue.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { PrescriptionsController } from './prescriptions/prescriptions.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { QueueService } from './queue/queue.service';

@Module({
  imports: [
    // Configuration modules
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    
    // Infrastructure modules
    LoggerModule,
    RedisModule,
    DatabaseModule,
    
    // Queue system
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD', ''),
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'ocr' },
      { name: 'prescription-analysis' },
      { name: 'notifications' }
    ),
        
    // Modules with circular dependencies
    forwardRef(() => PrescriptionsModule),
    forwardRef(() => BullQueueModule),
    // Feature modules
    LocationModule,
    PharmaciesModule,
    AdminModule,
    PharmacyStatsModule,
    StatsModule,
    PharmacyStatisticsModule,
    PharmacyStatsModuleModule,
    HealthModule,
    AuthModule,
    NotificationsModule,

  ],
  controllers: [
    AppController,
    StatisticsController,
    PharmacyStatsController,
    StatsEndpointController,
    PharmacyStatisticsEndpointController,
    DirectStatsController,
    PharmacyStatisticsRootController,
    PrescriptionsController
  ],
  providers: [
    AppService,
    LoggerService,
    QueueService,
  ],
  exports: [QueueService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}