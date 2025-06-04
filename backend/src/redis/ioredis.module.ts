import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';

@Global()
@Module({
  imports: [
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get('REDIS_URL') || 'redis://localhost:6379',
        options: {
          maxRetriesPerRequest: 5,
          enableReadyCheck: true,
          reconnectOnError: () => true,
        },
      }),
    }),
  ],
  exports: [NestRedisModule],
})
export class IoRedisModule {}
