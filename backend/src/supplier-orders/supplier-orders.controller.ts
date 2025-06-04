import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupplierOrdersService } from './supplier-orders.service';
import { CreateSupplierOrderDto } from './dto/create-supplier-order.dto';
import { UpdateSupplierOrderDto } from './dto/update-supplier-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('supplier-orders')
@Controller('api/supplier-orders')
@UseGuards(JwtAuthGuard)
export class SupplierOrdersController {
  constructor(private readonly supplierOrdersService: SupplierOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all supplier orders' })
  @ApiResponse({ status: 200, description: 'Returns all supplier orders' })
  async findAll() {
    const orders = await this.supplierOrdersService.findAll();
    return { status: 'success', data: orders };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier order by ID with items' })
  @ApiParam({ name: 'id', description: 'Supplier Order ID' })
  @ApiResponse({ status: 200, description: 'Returns a single supplier order with items' })
  @ApiResponse({ status: 404, description: 'Supplier order not found' })
  async findOne(@Param('id') id: string) {
    const order = await this.supplierOrdersService.getOrderWithItems(Number(id));
    if (!order) {
      return { status: 'error', message: 'Supplier order not found' };
    }
    return { status: 'success', data: order };
  }

  @Get('pharmacy/:pharmacyId')
  @ApiOperation({ summary: 'Get supplier orders for a specific pharmacy' })
  @ApiParam({ name: 'pharmacyId', description: 'Pharmacy ID' })
  @ApiResponse({ status: 200, description: 'Returns supplier orders for the pharmacy' })
  async getPharmacyOrders(@Param('pharmacyId') pharmacyId: string) {
    const orders = await this.supplierOrdersService.findByPharmacy(Number(pharmacyId));
    return { status: 'success', data: orders };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new supplier order' })
  @ApiResponse({ status: 201, description: 'Supplier order created successfully' })
  async create(@Body() createSupplierOrderDto: CreateSupplierOrderDto) {
    try {
      const { pharmacyId, supplierId, supplierName, items, status, notes } = createSupplierOrderDto;
      
      const result = await this.supplierOrdersService.createOrder(
        pharmacyId,
        supplierId || null,
        supplierName || null,
        items,
        status || 'pending',
        notes || null
      );
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a supplier order' })
  @ApiParam({ name: 'id', description: 'Supplier Order ID' })
  @ApiResponse({ status: 200, description: 'Supplier order updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier order not found' })
  async update(@Param('id') id: string, @Body() updateSupplierOrderDto: UpdateSupplierOrderDto) {
    try {
      const result = await this.supplierOrdersService.updateOrder(Number(id), {
        supplierId: updateSupplierOrderDto.supplierId,
        supplierName: updateSupplierOrderDto.supplierName,
        status: updateSupplierOrderDto.status,
        notes: updateSupplierOrderDto.notes,
        total: updateSupplierOrderDto.total,
        items: updateSupplierOrderDto.items,
      });
      
      if (!result.order) {
        return { status: 'error', message: 'Supplier order not found' };
      }
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update a supplier order status' })
  @ApiParam({ name: 'id', description: 'Supplier Order ID' })
  @ApiResponse({ status: 200, description: 'Supplier order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() data: { status: string; notes?: string }
  ) {
    try {
      const order = await this.supplierOrdersService.updateOrderStatus(
        Number(id),
        data.status,
        data.notes || null
      );
      
      if (!order) {
        return { status: 'error', message: 'Supplier order not found' };
      }
      
      return { status: 'success', data: order };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier order' })
  @ApiParam({ name: 'id', description: 'Supplier Order ID' })
  @ApiResponse({ status: 200, description: 'Supplier order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier order not found' })
  async remove(@Param('id') id: string) {
    try {
      const deleted = await this.supplierOrdersService.deleteOrder(Number(id));
      
      if (!deleted) {
        return { status: 'error', message: 'Supplier order not found' };
      }
      
      return { status: 'success', message: 'Supplier order deleted successfully' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('check-low-stock/:pharmacyId')
  @ApiOperation({ summary: 'Check for low stock items and create automatic orders' })
  @ApiParam({ name: 'pharmacyId', description: 'Pharmacy ID' })
  @ApiResponse({ status: 200, description: 'Low stock check completed' })
  async checkLowStockAndCreateOrder(
    @Param('pharmacyId') pharmacyId: string,
    @Body() data: { threshold?: number }
  ) {
    try {
      const result = await this.supplierOrdersService.checkLowStockAndCreateOrders(
        Number(pharmacyId),
        data.threshold || 10
      );
      
      if (!result) {
        return { 
          status: 'success', 
          message: 'No low stock items found that require reordering' 
        };
      }
      
      return { 
        status: 'success', 
        message: 'Automatic order created for low stock items',
        data: result 
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}