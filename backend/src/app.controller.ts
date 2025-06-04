import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('system')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly databaseService: DatabaseService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('testroute')
  getTestRoute() {
    this.logger.log('GET /api/testroute endpoint called');
    return { message: 'Test route working!' };
  }

  @Get('health')
  healthCheck(): { status: string; timestamp: string } {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }
  
  @Get('pharmacy-stats')
  async getPharmacyStats() {
    this.logger.log('GET /api/pharmacy-stats endpoint called');
    try {
      // Utiliser la requête SQL directe pour éviter les problèmes d'intégration ORM
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
  
  @Get('pharmacies/stats')
  async getPharmaciesStats() {
    this.logger.log('GET /api/pharmacies/stats endpoint called');
    try {
      // Utiliser la requête SQL directe pour éviter les problèmes d'intégration ORM
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
  
  @Get('stats/pharmacies') 
  @ApiOperation({ summary: 'Get pharmacy statistics - direct route' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns statistics about pharmacies by status',
  })
  async getStatsPharmacies() {
    this.logger.log('GET /api/stats/pharmacies endpoint called');
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