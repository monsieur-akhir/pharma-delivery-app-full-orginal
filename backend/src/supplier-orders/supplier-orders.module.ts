import { Module } from '@nestjs/common';
import { SupplierOrdersController } from './supplier-orders.controller';
import { SupplierOrdersService } from './supplier-orders.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SupplierOrdersController],
  providers: [SupplierOrdersService],
  exports: [SupplierOrdersService],
})
export class SupplierOrdersModule {}