import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update delivery location' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deliveryId: { type: 'string' },
        userId: { type: 'number' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        accuracy: { type: 'number' },
        altitude: { type: 'number' },
        speed: { type: 'number' },
        heading: { type: 'number' },
        timestamp: { type: 'number' },
      },
      required: ['deliveryId', 'userId', 'latitude', 'longitude'],
    },
  })
  @ApiResponse({ status: 201, description: 'Location updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateLocation(@Body() locationData: any) {
    return this.locationService.updateLocation(locationData);
  }

  @Get('current/:deliveryId')
  @ApiOperation({ summary: 'Get current location for a delivery' })
  @ApiParam({ name: 'deliveryId', description: 'ID of the delivery to track' })
  @ApiResponse({ status: 200, description: 'Current location returned' })
  @ApiResponse({ status: 404, description: 'No location data found' })
  async getCurrentLocation(@Param('deliveryId') deliveryId: string) {
    return this.locationService.getCurrentLocation(deliveryId);
  }

  @Get('history/:deliveryId')
  @ApiOperation({ summary: 'Get location history for a delivery' })
  @ApiParam({ name: 'deliveryId', description: 'ID of the delivery to track' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of history points to return',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Location history returned' })
  @ApiResponse({ status: 404, description: 'No location history found' })
  async getLocationHistory(
    @Param('deliveryId') deliveryId: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.locationService.getLocationHistory(deliveryId, limit);
  }

  @Get('eta/:deliveryId')
  @ApiOperation({ summary: 'Get estimated time of arrival' })
  @ApiParam({ name: 'deliveryId', description: 'ID of the delivery' })
  @ApiQuery({
    name: 'destinationLat',
    required: true,
    description: 'Destination latitude',
    type: Number,
  })
  @ApiQuery({
    name: 'destinationLng',
    required: true,
    description: 'Destination longitude',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'ETA information returned' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Location data not found' })
  async getETA(
    @Param('deliveryId') deliveryId: string,
    @Query('destinationLat') destinationLat: number,
    @Query('destinationLng') destinationLng: number,
  ) {
    return this.locationService.getETA(
      deliveryId,
      destinationLat,
      destinationLng,
    );
  }

  @Get('nearby-deliveries')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get nearby deliveries for a deliverer' })
  @ApiQuery({
    name: 'latitude',
    required: true,
    description: 'Current latitude',
    type: Number,
  })
  @ApiQuery({
    name: 'longitude',
    required: true,
    description: 'Current longitude',
    type: Number,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in kilometers',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Nearby deliveries returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNearbyDeliveries(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 5,
  ) {
    return this.locationService.getNearbyDeliveries(latitude, longitude, radius);
  }
}