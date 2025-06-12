import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('location')
@Controller('location')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update user location' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        address: { type: 'string' }
      }
    }
  })
  async updateLocation(@Req() req: any, @Body() locationData: any) {
    return this.locationService.updateLocation(req.user.id, locationData);
  }

  @Get('current/:deliveryId')
  @ApiOperation({ summary: 'Get current location for delivery' })
  @ApiParam({ name: 'deliveryId', type: 'string' })
  async getCurrentLocation(@Param('deliveryId') deliveryId: string) {
    return this.locationService.getCurrentLocation(deliveryId);
  }

  @Get('history/:deliveryId')
  @ApiOperation({ summary: 'Get location history for delivery' })
  @ApiParam({ name: 'deliveryId', type: 'string' })
  async getLocationHistory(@Param('deliveryId') deliveryId: string) {
    return this.locationService.getLocationHistory(deliveryId);
  }

  @Post('calculate-eta')
  @ApiOperation({ summary: 'Calculate ETA between two points' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        from: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' }
          }
        },
        to: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' }
          }
        }
      }
    }
  })
  async calculateETA(@Body() data: any) {
    return this.locationService.calculateETA(data);
  }
}