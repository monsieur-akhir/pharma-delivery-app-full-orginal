import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { count, eq } from 'drizzle-orm';
import { pharmacies, users, system_logs } from '../../../shared/schema';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get system statistics for the admin dashboard
   */
  async getSystemStats() {
    try {
      const db = this.databaseService.db;

      // Get counts for various entities
      const [
        userCount,
        pharmacyCount, 
        pendingPharmacyCount,
        logCount
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(pharmacies),
        db.select({ count: count() }).from(pharmacies).where(
          eq(pharmacies.status, 'PENDING')
        ),
        db.select({ count: count() }).from(system_logs)
      ]);

      return {
        users: userCount[0].count,
        pharmacies: {
          total: pharmacyCount[0].count,
          pending: pendingPharmacyCount[0].count,
          approved: pharmacyCount[0].count - pendingPharmacyCount[0].count
        },
        systemLogs: logCount[0].count,
        systemStatus: {
          isHealthy: true,
          lastChecked: new Date(),
          services: {
            database: true,
            api: true,
            notifications: true
          }
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get system stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    try {
      // Basic health checks
      const dbConnection = await this.checkDatabaseConnection();
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: dbConnection,
          api: true
        },
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      const db = this.databaseService.db;
      // Simple query to test connection
      await db.select({ count: count() }).from(users);
      return true;
    } catch (error) {
      this.logger.error(`Database connection check failed: ${error.message}`, error.stack);
      return false;
    }
  }
}