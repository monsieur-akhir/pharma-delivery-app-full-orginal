export interface Reminder {
  id: string;
  userId: string;
  title: string;
  message: string;
  scheduledFor: Date;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'sent' | 'cancelled';
  medicationId?: string;
  createdAt: Date;
  updatedAt: Date;
}
