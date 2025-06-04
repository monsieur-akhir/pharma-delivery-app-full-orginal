import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PharmacyStatisticsService {
  private readonly logger = new Logger(PharmacyStatisticsService.name);

  constructor(private readonly databaseService: DatabaseService) {
    this.logger.log('PharmacyStatisticsService initialized');
  }

  /**
   * Récupère les statistiques des pharmacies depuis la base de données
   */
  async getPharmacyStats() {
    this.logger.log('Fetching pharmacy statistics');
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