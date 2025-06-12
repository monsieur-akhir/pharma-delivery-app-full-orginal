
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('deliveries')
@Controller('deliveries')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get('assigned')
  @ApiOperation({ summary: 'Get assigned deliveries for delivery person' })
  @Roles('delivery')
  async getAssignedDeliveries(@Query('status') status: string, @Req() req) {
    return this.deliveriesService.getAssignedDeliveries(req.user.id, status);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available deliveries for delivery person' })
  @Roles('delivery')
  async getAvailableDeliveries(@Req() req) {
    return this.deliveriesService.getAvailableDeliveries(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get delivery history for delivery person' })
  @Roles('delivery')
  async getDeliveryHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Req() req
  ) {
    return this.deliveriesService.getDeliveryHistory(req.user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery details' })
  @Roles('delivery', 'customer', 'pharmacy_admin', 'pharmacist')
  async getDeliveryDetails(@Param('id') id: string, @Req() req) {
    return this.deliveriesService.getDeliveryDetails(+id, req.user);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a delivery' })
  @Roles('delivery')
  async acceptDelivery(@Param('id') id: string, @Req() req) {
    return this.deliveriesService.acceptDelivery(+id, req.user.id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Decline a delivery' })
  @Roles('delivery')
  async declineDelivery(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req
  ) {
    return this.deliveriesService.declineDelivery(+id, req.user.id, body.reason);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update delivery status' })
  @Roles('delivery')
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @Req() req
  ) {
    return this.deliveriesService.updateDeliveryStatus(+id, req.user.id, body.status, body.notes);
  }

  @Post(':id/arrived-pharmacy')
  @ApiOperation({ summary: 'Mark arrived at pharmacy' })
  @Roles('delivery')
  async markArrivedAtPharmacy(@Param('id') id: string, @Req() req) {
    return this.deliveriesService.markArrivedAtPharmacy(+id, req.user.id);
  }

  @Post(':id/picked-up')
  @ApiOperation({ summary: 'Mark medication picked up' })
  @Roles('delivery')
  async markMedicationPickedUp(
    @Param('id') id: string,
    @Body() body: { items: any[]; timestamp: number },
    @Req() req
  ) {
    return this.deliveriesService.markMedicationPickedUp(+id, req.user.id, body.items);
  }

  @Post(':id/arrived-customer')
  @ApiOperation({ summary: 'Mark arrived at customer' })
  @Roles('delivery')
  async markArrivedAtCustomer(@Param('id') id: string, @Req() req) {
    return this.deliveriesService.markArrivedAtCustomer(+id, req.user.id);
  }

  @Post(':id/send-verification-code')
  @ApiOperation({ summary: 'Send verification code to customer' })
  @Roles('delivery')
  async sendVerificationCode(@Param('id') id: string, @Req() req) {
    return this.deliveriesService.sendVerificationCode(+id, req.user.id);
  }

  @Post(':id/verify-code')
  @ApiOperation({ summary: 'Verify delivery code' })
  @Roles('delivery')
  async verifyDeliveryCode(
    @Param('id') id: string,
    @Body() body: { code: string },
    @Req() req
  ) {
    return this.deliveriesService.verifyDeliveryCode(+id, req.user.id, body.code);
  }

  @Post(':id/report-issue')
  @ApiOperation({ summary: 'Report delivery issue' })
  @Roles('delivery')
  async reportIssue(
    @Param('id') id: string,
    @Body() body: { issueType: string; description: string; photos?: string[] },
    @Req() req
  ) {
    return this.deliveriesService.reportIssue(+id, req.user.id, body.issueType, body.description, body.photos);
  }

  @Post(':id/upload-proof')
  @ApiOperation({ summary: 'Upload delivery proof photo' })
  @Roles('delivery')
  async uploadDeliveryProof(@Param('id') id: string, @Body() file: any, @Req() req) {
    return this.deliveriesService.uploadDeliveryProof(+id, req.user.id, file);
  }
}
