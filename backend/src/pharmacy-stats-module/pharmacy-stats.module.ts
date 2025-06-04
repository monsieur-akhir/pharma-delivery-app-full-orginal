import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PharmacyStatsModuleController } from './pharmacy-stats.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PharmacyStatsModuleController],
  providers: [],
})
export class PharmacyStatsModuleModule {}