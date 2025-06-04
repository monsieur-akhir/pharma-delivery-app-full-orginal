import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Controller('admin/pharmacy-stats')
export class PharmacyStatsController {
  constructor(private readonly databaseService: DatabaseService) {
    console.log('PharmacyStatsController initialized');
  }

  @Get()
  async getPharmacyStats() {
    console.log('GET /api/pharmacy-stats endpoint called');
    try {
      const result = await this.databaseService.getPharmacyStats();
      return result;
    } catch (error) {
      console.error('Error in getPharmacyStats:', error);
      throw new HttpException(
        `Failed to retrieve pharmacy statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}