import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@Controller('direct-stats')
@ApiTags('statistics')
export class DirectStatsController {
  private readonly logger = new Logger(DirectStatsController.name);

  constructor(private readonly databaseService: DatabaseService) {
    this.logger.log('DirectStatsController initialized');
  }

  @Get('pharmacies')
  @ApiOperation({ summary: 'Get pharmacy statistics directly' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns statistics about pharmacies by status',
  })
  async getStats() {
    this.logger.log('GET /api/direct-stats/pharmacies endpoint called');
    try {
      // Utiliser la requête SQL directe
      const totalResult = await this.databaseService.query('SELECT COUNT(*) FROM pharmacies');
      const pendingResult = await this.databaseService.query("SELECT COUNT(*) FROM pharmacies WHERE status = 'PENDING'");
      const approvedResult = await this.databaseService.query("SELECT COUNT(*) FROM pharmacies WHERE status = 'APPROVED'");
      const suspendedResult = await this.databaseService.query("SELECT COUNT(*) FROM pharmacies WHERE status = 'SUSPENDED'");
      const rejectedResult = await this.databaseService.query("SELECT COUNT(*) FROM pharmacies WHERE status = 'REJECTED'");
      
      const stats = {
        total: parseInt(totalResult.rows[0].count, 10) || 0,
        pending: parseInt(pendingResult.rows[0].count, 10) || 0,
        approved: parseInt(approvedResult.rows[0].count, 10) || 0,
        suspended: parseInt(suspendedResult.rows[0].count, 10) || 0,
        rejected: parseInt(rejectedResult.rows[0].count, 10) || 0
      };
      
      this.logger.log('Pharmacy stats result from direct route:', stats);
      return stats;
    } catch (error) {
      this.logger.error('Error fetching pharmacy stats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0, 
        suspended: 0,
        rejected: 0
      };
    }
  }
}