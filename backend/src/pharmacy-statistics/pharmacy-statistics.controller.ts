import { Controller, Get, Logger } from '@nestjs/common';
import { PharmacyStatisticsService } from './pharmacy-statistics.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('pharmacy-statistics')
@ApiTags('statistics')
export class PharmacyStatisticsController {
  private readonly logger = new Logger(PharmacyStatisticsController.name);

  constructor(private readonly pharmacyStatisticsService: PharmacyStatisticsService) {
    this.logger.log('PharmacyStatisticsController initialized');
  }

  @Get()
  @ApiOperation({ summary: 'Get pharmacy statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns statistics about pharmacies by status',
  })
  async getStats() {
    this.logger.log('GET /api/pharmacy-statistics endpoint called');
    return this.pharmacyStatisticsService.getPharmacyStats();
  }
}