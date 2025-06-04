import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DatabaseModule } from '../../database/database.module';
import { OrdersModule } from '../../orders/orders.module';
import { PharmacyModule } from '../../pharmacy/pharmacy.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    DatabaseModule,
    OrdersModule,
    PharmacyModule,
    UsersModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule {}
