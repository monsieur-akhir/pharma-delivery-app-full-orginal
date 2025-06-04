import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { DatabaseModule } from '../database/database.module';
import { PharmacyStatisticsController } from './pharmacy-stats.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [StatsController, PharmacyStatisticsController],
})
export class StatsModule {}