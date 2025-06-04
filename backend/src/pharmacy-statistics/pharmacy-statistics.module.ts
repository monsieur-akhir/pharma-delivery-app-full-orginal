import { Module } from '@nestjs/common';
import { PharmacyStatisticsController } from './pharmacy-statistics.controller';
import { PharmacyStatisticsService } from './pharmacy-statistics.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PharmacyStatisticsController],
  providers: [PharmacyStatisticsService],
  exports: [PharmacyStatisticsService]
})
export class PharmacyStatisticsModule {}