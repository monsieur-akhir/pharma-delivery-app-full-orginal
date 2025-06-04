export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}
