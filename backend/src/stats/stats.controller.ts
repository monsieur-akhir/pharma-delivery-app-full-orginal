import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly databaseService: DatabaseService) {
    console.log('StatsController initialized');
  }

  @Get('pharmacies')
  async getPharmacyStats() {
    console.log('GET /api/stats/pharmacies endpoint called');
    try {
      const result = await this.databaseService.getPharmacyStats();
      console.log('Pharmacy stats result:', result);
      return result;
    } catch (error) {
      console.error('Error in getPharmacyStats:', error);
      throw new HttpException(
        `Failed to retrieve pharmacy statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard')
  async getDashboardStats(@Query('period') period: string = 'daily') {
    console.log(`GET /api/stats/dashboard endpoint called with period: ${period}`);
    try {
      // Données simulées pour démarrer
      return {
        totalUsers: 215,
        totalOrders: 358,
        pendingOrders: 24,
        completedOrders: 334,
        totalRevenue: 42560,
        data: {
          userGrowth: 3.2,
          orderGrowth: 4.7,
          pharmacyGrowth: 1.5,
          growthRate: 2.5,
          newUsersToday: 12,
          activeUserRate: 68,
          pendingPharmacies: 3,
        },
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw new HttpException(
        `Failed to retrieve dashboard statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Get('revenue')
  async getRevenueStats(@Query('period') period: string = 'monthly') {
    console.log(`GET /api/stats/revenue endpoint called with period: ${period}`);
    try {
      let labels = [];
      let values = [];
      
      // Generate sample data based on period
      switch (period) {
        case 'daily':
          // Last 7 days
          labels = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toLocaleDateString('fr-FR', { weekday: 'short' });
          });
          values = labels.map(() => Math.floor(Math.random() * 5000) + 1000);
          break;
        
        case 'weekly':
          // Last 4 weeks
          labels = Array.from({ length: 4 }, (_, i) => `Semaine ${i + 1}`);
          values = labels.map(() => Math.floor(Math.random() * 20000) + 5000);
          break;
        
        case 'monthly':
          // Last 12 months
          labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
          values = labels.map(() => Math.floor(Math.random() * 50000) + 10000);
          break;
        
        case 'yearly':
          // Last 5 years
          const currentYear = new Date().getFullYear();
          labels = Array.from({ length: 5 }, (_, i) => `${currentYear - 4 + i}`);
          values = labels.map(() => Math.floor(Math.random() * 500000) + 100000);
          break;
        
        default:
          labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
          values = labels.map(() => Math.floor(Math.random() * 50000) + 10000);
      }
      
      return { labels, values, total: values.reduce((a, b) => a + b, 0) };
    } catch (error) {
      console.error('Error in getRevenueStats:', error);
      throw new HttpException(
        `Failed to retrieve revenue statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users')
  async getUsersStats(@Query('period') period: string = 'monthly') {
    console.log(`GET /api/v1/stats/users endpoint called with period: ${period}`);
    try {
      let labels = [];
      let values = [];
      
      // Generate sample data based on period
      switch (period) {
        case 'daily':
          // Last 7 days
          labels = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toLocaleDateString('fr-FR', { weekday: 'short' });
          });
          values = labels.map(() => Math.floor(Math.random() * 20) + 5);
          break;
        
        case 'weekly':
          // Last 4 weeks
          labels = Array.from({ length: 4 }, (_, i) => `Semaine ${i + 1}`);
          values = labels.map(() => Math.floor(Math.random() * 50) + 20);
          break;
        
        case 'monthly':
          // Last 12 months
          labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
          values = labels.map(() => Math.floor(Math.random() * 100) + 30);
          break;
        
        case 'yearly':
          // Last 5 years
          const currentYear = new Date().getFullYear();
          labels = Array.from({ length: 5 }, (_, i) => `${currentYear - 4 + i}`);
          values = labels.map(() => Math.floor(Math.random() * 500) + 100);
          break;
        
        default:
          labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
          values = labels.map(() => Math.floor(Math.random() * 100) + 30);
      }
      
      return { 
        labels, 
        values, 
        total: values.reduce((a, b) => a + b, 0),
        newUsers: Math.floor(Math.random() * 20) + 5,
        activeUsers: Math.floor(Math.random() * 200) + 50
      };
    } catch (error) {
      console.error('Error in getUsersStats:', error);
      throw new HttpException(
        `Failed to retrieve user statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}