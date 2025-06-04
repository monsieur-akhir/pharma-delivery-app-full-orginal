import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { ScheduledTasksController } from './scheduled-tasks.controller';
import { DatabaseModule } from '../database/database.module';
import { SupplierOrdersModule } from '../supplier-orders/supplier-orders.module';

@Module({
  imports: [
    DatabaseModule,
    SupplierOrdersModule,
  ],
  providers: [ScheduledTasksService],
  controllers: [ScheduledTasksController],
  exports: [ScheduledTasksService],
})
export class ScheduledTasksModule {}