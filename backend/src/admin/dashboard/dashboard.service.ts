import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { eq, count, and, gt, lt, sql } from 'drizzle-orm';
import { pharmacies, users, orders, medicines, pharmacy_medicines, order_items } from '../../../../shared/src/schema';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    this.logger.log('Getting dashboard stats');
    
    try {
      // Get user statistics
      const totalUsersResult = await this.databaseService.db
        .select({ count: count() })
        .from(users);
      
      const newTodayUsersResult = await this.databaseService.db
        .select({ count: count() })
        .from(users)
        .where(
          gt(users.created_at, 
            sql`DATE_TRUNC('day', CURRENT_TIMESTAMP)`)
        );
      
      const activeUsersResult = await this.databaseService.db
        .select({ count: count() })
        .from(users)
        .where(eq(users.is_active, true));

      const lastMonthUsersResult = await this.databaseService.db
        .select({ count: count() })
        .from(users)
        .where(
          gt(users.created_at, 
            sql`DATE_TRUNC('month', CURRENT_TIMESTAMP) - INTERVAL '1 month'`)
        );

      const currentMonthUsersResult = await this.databaseService.db
        .select({ count: count() })
        .from(users)
        .where(
          gt(users.created_at, 
            sql`DATE_TRUNC('month', CURRENT_TIMESTAMP)`)
        );

      // Get pharmacy statistics
      const totalPharmaciesResult = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacies);

      const activePharmaciesResult = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacies)
        .where(eq(pharmacies.is_active, true));

      const pendingPharmaciesResult = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacies)
        .where(eq(pharmacies.status, 'PENDING'));

      const lastMonthPharmaciesResult = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacies)
        .where(
          gt(pharmacies.created_at, 
            sql`DATE_TRUNC('month', CURRENT_TIMESTAMP) - INTERVAL '1 month'`)
        );

      const currentMonthPharmaciesResult = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacies)
        .where(
          gt(pharmacies.created_at, 
            sql`DATE_TRUNC('month', CURRENT_TIMESTAMP)`)
        );

      // Get order statistics
      const totalOrdersResult = await this.databaseService.db
        .select({ count: count() })
        .from(orders);

      const pendingOrdersResult = await this.databaseService.db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, 'PENDING'));

      const deliveredOrdersResult = await this.databaseService.db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, 'DELIVERED'));

      const totalSalesResult = await this.databaseService.db
        .select({ sum: sql<number>`SUM(total_amount)` })
        .from(orders);

      const lastMonthOrdersResult = await this.databaseService.db
        .select({ count: count() })
        .from(orders)
        .where(
          gt(orders.created_at, 
            sql`DATE_TRUNC('month', CURRENT_TIMESTAMP) - INTERVAL '1 month'`)
        );

      const currentMonthOrdersResult = await this.databaseService.db
        .select({ count: count() })
        .from(orders)
        .where(
          gt(orders.created_at, 
            sql`DATE_TRUNC('month', CURRENT_TIMESTAMP)`)
        );

      // Get medicine statistics
      const totalMedicinesResult = await this.databaseService.db
        .select({ count: count() })
        .from(medicines);

      const lowStockMedicinesResult = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacy_medicines)
        .where(and(
          gt(pharmacy_medicines.stock, 0),
          lt(pharmacy_medicines.stock, pharmacy_medicines.reorder_threshold)
        ));

      const outOfStockMedicinesResult = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacy_medicines)
        .where(eq(pharmacy_medicines.stock, 0));

      // Get most ordered medicine
      const mostOrderedMedicineResult = await this.databaseService.db
        .select({
          medicine_id: order_items.medicine_id,
          total: sql<number>`SUM(quantity)`,
          name: medicines.name
        })
        .from(order_items)
        .innerJoin(medicines, eq(order_items.medicine_id, medicines.id))
        .groupBy(order_items.medicine_id, medicines.name)
        .orderBy(sql`SUM(quantity) DESC`)
        .limit(1);

      // Calculate growth rates
      const usersGrowth = lastMonthUsersResult[0]?.count > 0 
        ? ((currentMonthUsersResult[0]?.count - lastMonthUsersResult[0]?.count) / lastMonthUsersResult[0]?.count) * 100
        : 0;

      const pharmaciesGrowth = lastMonthPharmaciesResult[0]?.count > 0
        ? ((currentMonthPharmaciesResult[0]?.count - lastMonthPharmaciesResult[0]?.count) / lastMonthPharmaciesResult[0]?.count) * 100
        : 0;

      const ordersGrowth = lastMonthOrdersResult[0]?.count > 0
        ? ((currentMonthOrdersResult[0]?.count - lastMonthOrdersResult[0]?.count) / lastMonthOrdersResult[0]?.count) * 100
        : 0;

      // Prepare response
      return {
        users: {
          total: totalUsersResult[0]?.count || 0,
          newToday: newTodayUsersResult[0]?.count || 0,
          activeRate: activeUsersResult[0]?.count > 0 
            ? Math.round((activeUsersResult[0].count / totalUsersResult[0].count) * 100)
            : 0,
          growth: parseFloat(usersGrowth.toFixed(1))
        },
        pharmacies: {
          total: totalPharmaciesResult[0]?.count || 0,
          active: activePharmaciesResult[0]?.count || 0,
          pending: pendingPharmaciesResult[0]?.count || 0,
          growth: parseFloat(pharmaciesGrowth.toFixed(1))
        },
        orders: {
          total: totalOrdersResult[0]?.count || 0,
          pending: pendingOrdersResult[0]?.count || 0,
          delivered: deliveredOrdersResult[0]?.count || 0,
          totalSales: totalSalesResult[0]?.sum || 0,
          growth: parseFloat(ordersGrowth.toFixed(1))
        },
        medicines: {
          total: totalMedicinesResult[0]?.count || 0,
          lowStock: lowStockMedicinesResult[0]?.count || 0,
          outOfStock: outOfStockMedicinesResult[0]?.count || 0,
          mostOrdered: mostOrderedMedicineResult[0]?.name || 'N/A'
        }
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard stats: ${error.message}`);
      throw error;
    }
  }
  /**
   * Get orders chart data
   */
  async getOrdersChartData() {
    this.logger.log('Getting orders chart data');
    
    try {
      // Generate dates for the last 30 days
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });
      
      // Get orders count per day for the last 30 days
      const ordersByDay = await this.databaseService.db.execute(sql`
        SELECT 
          DATE(created_at) as order_date, 
          COUNT(*) as order_count
        FROM 
          orders
        WHERE 
          created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY 
          DATE(created_at)
        ORDER BY 
          DATE(created_at)
      `);
      
      // Map database results to chart format
      const ordersMap = new Map();
      
      // Initialize with 0 values
      dates.forEach(date => {
        ordersMap.set(date, 0);
      });
      
      // Fill in actual values from database
      ordersByDay.rows.forEach((row: any) => {
        const dateStr = new Date((row as any).order_date).toISOString().split('T')[0];
        if (ordersMap.has(dateStr)) {
          ordersMap.set(dateStr, parseInt((row as any).order_count));
        }
      });
      
      return {
        labels: dates,
        orders: dates.map(date => ordersMap.get(date))
      };
    } catch (error) {
      this.logger.error(`Error getting orders chart data: ${error.message}`);
      throw error;
    }
  }
  /**
   * Get users distribution chart
   */
  async getUsersDistributionChart() {
    this.logger.log('Getting users distribution chart');
    
    try {
      // Get user counts by role
      const usersByRoleResult = await this.databaseService.db.execute(sql`
        SELECT 
          role, 
          COUNT(*) as user_count
        FROM 
          users 
        GROUP BY 
          role 
        ORDER BY 
          COUNT(*) DESC
      `);
      const usersByRole = usersByRoleResult.rows;
      
      // Map to French labels based on roles
      const roleMappings = {
        'CUSTOMER': 'Clients',
        'PHARMACIST': 'Pharmaciens',
        'PHARMACY_STAFF': 'Personnel de pharmacie',
        'DELIVERY_PERSON': 'Livreurs',
        'ADMIN': 'Administrateurs',
        'SUPER_ADMIN': 'Super Administrateurs',
        'MANAGER': 'Managers',
        'SUPPORT': 'Support',
        'VIEWER': 'Observateurs'
      };
      
      const labels = [];
      const values = [];
      usersByRole.forEach((row: any) => {
        labels.push(roleMappings[row.role] || row.role);
        values.push(parseInt(row.user_count, 10));
      });
      
      return { labels, values };
    } catch (error) {
      this.logger.error(`Error getting users distribution chart: ${error.message}`);
      throw error;
    }
  }
  /**
   * Get audit logs with pagination
   */
  async getAuditLogs(page: number = 0, limit: number = 10) {
    this.logger.log(`Getting audit logs, page: ${page}, limit: ${limit}`);
    
    try {
      const offset = page * limit;
      
      // Use the system_logs table for audit logs
      const logsResult = await this.databaseService.db.execute(sql`
        SELECT 
          sl.id, 
          sl.action, 
          sl.entity, 
          sl.entity_id, 
          sl.type,
          sl.user_id, 
          sl.ip_address, 
          sl.details, 
          sl.created_at,
          u.username
        FROM 
          system_logs sl
        LEFT JOIN 
          users u ON sl.user_id = u.id
        ORDER BY 
          sl.created_at DESC
        LIMIT ${limit} 
        OFFSET ${offset}
      `);
      
      // Get total count
      const countResult = await this.databaseService.db.execute(sql`
        SELECT COUNT(*) as total FROM system_logs
      `);
      
      const total = parseInt(countResult[0].total);
      
      // Map database results to expected format
      const auditLogs = logsResult.rows.map(log => ({
        id: log.id,
        userId: log.user_id,
        username: log.username || 'Système',
        action: log.action,
        entityType: log.entity,
        entityId: log.entity_id,
        details: log.details,
        timestamp: log.created_at,
        ipAddress: log.ip_address || 'N/A',
        type: log.type || 'SYSTEM'
      }));
      
      return {
        data: auditLogs,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error(`Error getting audit logs: ${error.message}`);
      throw error;
    }
  }
  /**
   * Get top medicines
   */
  async getTopMedicines() {
    this.logger.log('Getting top medicines');
    
    try {
      // Get top 5 most ordered medicines
      const topMedicinesResult = await this.databaseService.db.execute(sql`
        SELECT 
          m.name, 
          SUM(oi.quantity) as count
        FROM 
          order_items oi
        JOIN 
          medicines m ON oi.medicine_id = m.id
        JOIN 
          orders o ON oi.order_id = o.id
        WHERE 
          o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY 
          m.id, m.name
        ORDER BY 
          count DESC
        LIMIT 5
      `);
      
      // Map database results
      const medicines = topMedicinesResult.rows.map((row: any) => ({
        name: row.name,
        count: parseInt(row.count)
      }));
      
      return { medicines: medicines.length ? medicines : [] };
    } catch (error) {
      this.logger.error(`Error getting top medicines: ${error.message}`);
      throw error;
    }
  }
  /**
   * Get recent orders
   */
  async getRecentOrders() {
    this.logger.log('Getting recent orders');
    
    try {
      // Get 5 most recent orders
      const recentOrdersResult = await this.databaseService.db.execute(sql`
        SELECT 
          o.id,
          o.order_number as "orderNumber",
          u.username,
          u.first_name,
          u.last_name,
          o.total_amount as total,
          o.status,
          o.created_at as date
        FROM 
          orders o
        JOIN 
          users u ON o.user_id = u.id
        ORDER BY 
          o.created_at DESC
        LIMIT 5
      `);
      
      // Map database results
      const orders = recentOrdersResult.rows.map((row: any) => {
        const customerName = row.first_name || row.last_name ? 
          `${row.first_name || ''} ${row.last_name || ''}`.trim() : 
          row.username;
          
        return {
          id: row.id,
          orderNumber: row.orderNumber,
          customer: customerName,
          total: parseFloat(row.total as string),
          status: row.status,
          date: row.date
        };
      });
      
      return orders;
      
    } catch (error) {
      this.logger.error(`Error getting recent orders: ${error.message}`);
      throw error;
    }
  }
}
