import { Controller, Get, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

// Un contrôleur dédié pour les statistiques des pharmacies
@Controller('pharmacy-statistics')
export class PharmacyStatisticsController {
  private readonly logger = new Logger(PharmacyStatisticsController.name);

  constructor(private readonly databaseService: DatabaseService) {
    this.logger.log('PharmacyStatisticsController initialized');
  }

  @Get()
  async getPharmacyStats() {
    this.logger.log('GET /api/pharmacy-statistics endpoint called');
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
      
      this.logger.log('Pharmacy stats result:', stats);
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