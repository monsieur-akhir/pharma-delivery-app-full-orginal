import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryTrackingService } from './delivery-tracking.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { 
  DeliveryDto, 
  LocationUpdateDto, 
  DeliveryStatusUpdateDto, 
  DeliveryFilterDto,
  DeliveryStatisticsResponseDto
} from './dto';

@ApiTags('delivery-tracking')
@Controller('delivery-tracking')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DeliveryTrackingController {
  constructor(private readonly deliveryTrackingService: DeliveryTrackingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all deliveries with optional filtering' })
  @ApiResponse({ status: 200, description: 'Return all deliveries' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by delivery status' })
  @ApiQuery({ name: 'pharmacyId', required: false, description: 'Filter by pharmacy ID' })
  @ApiQuery({ name: 'deliveryPersonId', required: false, description: 'Filter by delivery person ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by delivery date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @Roles('admin', 'pharmacy_admin', 'pharmacist', 'delivery')
  async findAll(@Query() filterDto: DeliveryFilterDto, @Req() req) {
    return this.deliveryTrackingService.findAll(filterDto, req.user);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active deliveries' })
  @ApiResponse({ status: 200, description: 'Return active deliveries' })
  @Roles('admin', 'pharmacy_admin', 'pharmacist', 'delivery')
  async getActiveDeliveries(@Req() req) {
    return this.deliveryTrackingService.getActiveDeliveries(req.user);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get delivery statistics' })
  @ApiResponse({ status: 200, description: 'Return delivery statistics', type: DeliveryStatisticsResponseDto })
  @Roles('admin', 'pharmacy_admin')
  async getStatistics(@Req() req) {
    return this.deliveryTrackingService.getStatistics(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by ID' })
  @ApiResponse({ status: 200, description: 'Return the delivery' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  @ApiParam({ name: 'id', description: 'Delivery ID' })
  @Roles('admin', 'pharmacy_admin', 'pharmacist', 'delivery', 'customer')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.deliveryTrackingService.findOne(+id, req.user);
  }

  @Post('update-location')
  @ApiOperation({ summary: 'Update delivery location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles('delivery')
  async updateLocation(@Body() locationUpdateDto: LocationUpdateDto, @Req() req) {
    return this.deliveryTrackingService.updateLocation(locationUpdateDto, req.user);
  }

  @Post('update-status')
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles('delivery', 'pharmacy_admin', 'pharmacist')
  async updateStatus(@Body() statusUpdateDto: DeliveryStatusUpdateDto, @Req() req) {
    return this.deliveryTrackingService.updateStatus(statusUpdateDto, req.user);
  }

  @Get(':id/location-history')
  @ApiOperation({ summary: 'Get delivery location history' })
  @ApiResponse({ status: 200, description: 'Return location history' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  @ApiParam({ name: 'id', description: 'Delivery ID' })
  @Roles('admin', 'pharmacy_admin', 'pharmacist', 'delivery', 'customer')
  async getLocationHistory(@Param('id') id: string, @Req() req) {
    return this.deliveryTrackingService.getLocationHistory(+id, req.user);
  }

  @Get(':id/eta')
  @ApiOperation({ summary: 'Get estimated time of arrival' })
  @ApiResponse({ status: 200, description: 'Return ETA information' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  @ApiParam({ name: 'id', description: 'Delivery ID' })
  @Roles('admin', 'pharmacy_admin', 'pharmacist', 'delivery', 'customer')
  async getEta(@Param('id') id: string, @Req() req) {
    return this.deliveryTrackingService.getEta(+id, req.user);
  }

  @Get(':id/route')
  @ApiOperation({ summary: 'Get delivery route' })
  @ApiResponse({ status: 200, description: 'Return route information' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  @ApiParam({ name: 'id', description: 'Delivery ID' })
  @Roles('admin', 'pharmacy_admin', 'pharmacist', 'delivery', 'customer')
  async getRoute(@Param('id') id: string, @Req() req) {
    return this.deliveryTrackingService.getRoute(+id, req.user);
  }
}