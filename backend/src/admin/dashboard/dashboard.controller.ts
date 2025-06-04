import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('charts/orders')
  async getOrdersChartData() {
    return this.dashboardService.getOrdersChartData();
  }

  @Get('charts/users-distribution')
  async getUsersDistributionChart() {
    return this.dashboardService.getUsersDistributionChart();
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page: string = '0',
    @Query('limit') limit: string = '10'
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.dashboardService.getAuditLogs(pageNumber, limitNumber);
  }

  @Get('top-medicines')
  async getTopMedicines() {
    return this.dashboardService.getTopMedicines();
  }

  @Get('recent-orders')
  async getRecentOrders() {
    return this.dashboardService.getRecentOrders();
  }
}
