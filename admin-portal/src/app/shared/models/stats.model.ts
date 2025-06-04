export interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data?: any;
}
