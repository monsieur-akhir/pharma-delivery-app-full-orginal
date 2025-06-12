
import { Controller, Get, Put, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeliverersService } from './deliverers.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('deliverers')
@Controller('deliverers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DeliverersController {
  constructor(private readonly deliverersService: DeliverersService) {}

  @Get('online-status')
  @ApiOperation({ summary: 'Get deliverer online status' })
  @Roles('delivery')
  async getOnlineStatus(@Req() req) {
    return this.deliverersService.getOnlineStatus(req.user.id);
  }

  @Put('online-status')
  @ApiOperation({ summary: 'Update deliverer online status' })
  @Roles('delivery')
  async updateOnlineStatus(@Body() body: { isOnline: boolean }, @Req() req) {
    return this.deliverersService.updateOnlineStatus(req.user.id, body.isOnline);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get deliverer statistics' })
  @Roles('delivery')
  async getDelivererStats(@Req() req) {
    return this.deliverersService.getDelivererStats(req.user.id);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get deliverer earnings' })
  @Roles('delivery')
  async getEarnings(@Query('period') period: string, @Req() req) {
    return this.deliverersService.getEarnings(req.user.id, period);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update deliverer profile' })
  @Roles('delivery')
  async updateDelivererProfile(@Body() profileData: any, @Req() req) {
    return this.deliverersService.updateDelivererProfile(req.user.id, profileData);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get deliverer notifications' })
  @Roles('delivery')
  async getDelivererNotifications(@Req() req) {
    return this.deliverersService.getDelivererNotifications(req.user.id);
  }
}
