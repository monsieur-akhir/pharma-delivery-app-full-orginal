import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { DatabaseModule } from '../database/database.module';
import { PharmacyStatsHealthController } from './pharmacy-stats.controller';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    DatabaseModule,
    PrescriptionsModule
  ],
  controllers: [HealthController, PharmacyStatsHealthController],
})
export class HealthModule {}