export interface PharmacyStatistics {
  id: string;
  pharmacyId: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  period: string;
  createdAt: Date;
  updatedAt: Date;
}
