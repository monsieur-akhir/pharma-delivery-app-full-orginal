import { Module } from '@nestjs/common';
import { PharmaciesController } from './pharmacies.controller';
import { PharmaciesService } from './pharmacies.service';
import { PharmacyStatsController } from './pharmacy-stats.controller';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';

console.log('PharmaciesModule loading...');

@Module({
  imports: [DatabaseModule],
  controllers: [PharmaciesController, PharmacyStatsController],
  providers: [PharmaciesService],
  exports: [PharmaciesService],
})
export class PharmaciesModule {}