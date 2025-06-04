export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'prescription' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
