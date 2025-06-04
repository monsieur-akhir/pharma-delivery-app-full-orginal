import { Injectable } from '@angular/core';
import { UserService } from './api/user.service';
import { PharmacyService } from './api/pharmacy.service';
import { OrderService } from './api/order.service';
import { PrescriptionService } from './api/prescription.service';
import { PaymentService } from './api/payment.service';
import { NotificationService } from './api/notification.service';
import { SupplierOrderService } from './api/supplier-order.service';
import { ReminderService } from './api/reminder.service';
import { StatsService } from './api/stats.service';
import { VideoChatService } from './api/video-chat.service';
import { ScheduledTaskService } from './api/scheduled-task.service';
import { PharmacyStatisticsService } from './api/pharmacy-statistics.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    public users: UserService,
    public pharmacies: PharmacyService,
    public orders: OrderService,
    public prescriptions: PrescriptionService,
    public payments: PaymentService,
    public notifications: NotificationService,
    public supplierOrders: SupplierOrderService,
    public reminders: ReminderService,
    public stats: StatsService,
    public videoChat: VideoChatService,
    public scheduledTasks: ScheduledTaskService,
    public pharmacyStatistics: PharmacyStatisticsService
  ) {}
}
