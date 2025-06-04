import { Module } from '@nestjs/common';
import { PharmacyStatsController } from './pharmacy-stats.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PharmacyStatsController],
})
export class PharmacyStatsModule {}