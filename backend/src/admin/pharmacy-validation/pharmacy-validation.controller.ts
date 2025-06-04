import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PharmacyValidationService } from './pharmacy-validation.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { pharmacyStatusEnum } from '../../../../shared/src/schema';

interface RequestUser {
  id: number;
  roles: string[];
}

type PharmacyStatus = typeof pharmacyStatusEnum.enumValues[number];

@ApiTags('admin/pharmacies')
@Controller('api/admin/pharmacies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class PharmacyValidationController {
  constructor(private readonly pharmacyValidationService: PharmacyValidationService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get all pharmacies pending validation' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPendingPharmacies(
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ) {
    return this.pharmacyValidationService.getPendingPharmacies(Number(page), Number(limit));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search pharmacies by status and term' })
  @ApiQuery({ name: 'status', required: false, enum: pharmacyStatusEnum.enumValues })
  @ApiQuery({ name: 'term', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchPharmacies(
    @Query('status') status?: PharmacyStatus,
    @Query('term') term?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ) {
    return this.pharmacyValidationService.searchPharmacies(
      status,
      term,
      Number(page),
      Number(limit)
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pharmacy details for validation' })
  @ApiParam({ name: 'id', description: 'Pharmacy ID' })
  async getPharmacyForValidation(@Param('id') id: string) {
    return this.pharmacyValidationService.getPharmacyForValidation(Number(id));
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a pharmacy' })
  @ApiParam({ name: 'id', description: 'Pharmacy ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string' }
      }
    }
  })
  async approvePharmacy(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: { user: RequestUser }
  ) {
    return this.pharmacyValidationService.approvePharmacy(
      Number(id),
      req.user.id,
      body.notes
    );
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a pharmacy' })
  @ApiParam({ name: 'id', description: 'Pharmacy ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' }
      },
      required: ['reason']
    }
  })
  async rejectPharmacy(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: { user: RequestUser }
  ) {
    return this.pharmacyValidationService.rejectPharmacy(
      Number(id),
      req.user.id,
      body.reason
    );
  }

  @Put(':id/request-info')
  @ApiOperation({ summary: 'Request additional information for a pharmacy' })
  @ApiParam({ name: 'id', description: 'Pharmacy ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        requestedInfo: { type: 'string' }
      },
      required: ['requestedInfo']
    }
  })
  async requestMoreInformation(
    @Param('id') id: string,
    @Body() body: { requestedInfo: string },
    @Req() req: { user: RequestUser }
  ) {
    return this.pharmacyValidationService.requestMoreInformation(
      Number(id),
      req.user.id,
      body.requestedInfo
    );
  }
}