import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, and, gte, lte } from 'drizzle-orm';
import { 
  reminders, 
  type Reminder,
  type InsertReminder,
  medicines,
  users
} from '../../../shared/schema';

@Injectable()
export class RemindersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<Reminder[]> {
    return this.databaseService.db.select().from(reminders);
  }

  async findById(id: number): Promise<Reminder | undefined> {
    const [reminder] = await this.databaseService.db
      .select()
      .from(reminders)
      .where(eq(reminders.id, id));
    return reminder;
  }

  async findByUser(userId: number): Promise<Reminder[]> {
    return this.databaseService.db
      .select()
      .from(reminders)
      .where(eq(reminders.user_id, userId))
      .orderBy(reminders.start_date);
  }

  async findActiveByUser(userId: number): Promise<Reminder[]> {
    return this.databaseService.db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.user_id, userId),
          eq(reminders.is_active, true)
        )
      )
      .orderBy(reminders.next_reminder);
  }

  async findDueReminders(userId: number, date: Date): Promise<Reminder[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.databaseService.db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.user_id, userId),
          eq(reminders.is_active, true),
          gte(reminders.next_reminder, startOfDay),
          lte(reminders.next_reminder, endOfDay)
        )
      )
      .orderBy(reminders.next_reminder);
  }

  async create(reminderData: {
    userId: number;
    medicineName: string;
    medicineId?: number;
    dosage?: string;
    schedule: any;
    startDate: string;
    endDate?: string;
    isActive?: boolean;
  }): Promise<Reminder> {
    const nextReminder = this.calculateNextReminder(
      reminderData.schedule,
      new Date(reminderData.startDate)
    );
    
    const insertReminderData: InsertReminder = {
      user_id: reminderData.userId,
      medicine_name: reminderData.medicineName,
      medicine_id: reminderData.medicineId,
      dosage: reminderData.dosage,
      schedule: reminderData.schedule,
      start_date: new Date(reminderData.startDate),
      end_date: reminderData.endDate ? new Date(reminderData.endDate) : null,
      is_active: reminderData.isActive ?? true,
      created_at: new Date(),
      updated_at: new Date(),
      next_reminder: nextReminder,
    };
    
    const [newReminder] = await this.databaseService.db
      .insert(reminders)
      .values(insertReminderData)
      .returning();
    
    return newReminder;
  }

  async update(
    id: number,
    reminderData: Partial<{
      medicineName: string;
      medicineId: number;
      dosage: string;
      schedule: any;
      startDate: string;
      endDate: string;
      isActive: boolean;
    }>
  ): Promise<Reminder> {
    // Get current reminder to calculate next reminder time if schedule changes
    const [currentReminder] = await this.databaseService.db
      .select()
      .from(reminders)
      .where(eq(reminders.id, id));
    
    let nextReminder = currentReminder.next_reminder;
    
    // If schedule or start date changed, recalculate next reminder
    if (reminderData.schedule || reminderData.startDate) {
      const schedule = reminderData.schedule || currentReminder.schedule;
      const startDate = reminderData.startDate ? 
        new Date(reminderData.startDate) : currentReminder.start_date;
      
      nextReminder = this.calculateNextReminder(schedule, startDate);
    }
    
    const [updatedReminder] = await this.databaseService.db
      .update(reminders)
      .set({
        ...(reminderData.medicineName && { medicine_name: reminderData.medicineName }),
        ...(reminderData.medicineId !== undefined && { medicine_id: reminderData.medicineId }),
        ...(reminderData.dosage && { dosage: reminderData.dosage }),
        ...(reminderData.schedule && { schedule: reminderData.schedule }),
        ...(reminderData.startDate && { start_date: new Date(reminderData.startDate) }),
        ...(reminderData.endDate && { end_date: new Date(reminderData.endDate) }),
        ...(reminderData.isActive !== undefined && { is_active: reminderData.isActive }),
        updated_at: new Date(),
        next_reminder: nextReminder,
      })
      .where(eq(reminders.id, id))
      .returning();
    
    return updatedReminder;
  }

  async recordMedication(reminderId: number, takenAt: Date): Promise<Reminder> {
    // Get current reminder
    const [currentReminder] = await this.databaseService.db
      .select()
      .from(reminders)
      .where(eq(reminders.id, reminderId));
    
    if (!currentReminder) {
      throw new Error('Reminder not found');
    }
    
    // Calculate next reminder time
    const nextReminder = this.calculateNextReminder(
      currentReminder.schedule,
      takenAt
    );
    
    // Update reminder with last taken time and next reminder time
    const [updatedReminder] = await this.databaseService.db
      .update(reminders)
      .set({
        last_taken: takenAt,
        next_reminder: nextReminder,
        updated_at: new Date(),
      })
      .where(eq(reminders.id, reminderId))
      .returning();
    
    return updatedReminder;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.databaseService.db
      .delete(reminders)
      .where(eq(reminders.id, id))
      .returning();
    
    return result.length > 0;
  }

  private calculateNextReminder(schedule: any, fromDate: Date): Date {
    const now = new Date(fromDate);
    const nextReminder = new Date(now);
    
    switch (schedule.frequency) {
      case 'daily':
        // Find the next time today or tomorrow
        const foundTimeToday = this.findNextTimeToday(schedule.times, now);
        if (foundTimeToday) {
          return foundTimeToday;
        } else {
          // Set to first time tomorrow
          nextReminder.setDate(nextReminder.getDate() + 1);
          nextReminder.setHours(schedule.times[0].hour, schedule.times[0].minute, 0, 0);
          return nextReminder;
        }
        
      case 'weekly':
        // Find the next day of the week
        const today = now.getDay();
        let daysUntilNext = 7;
        
        for (const day of schedule.days) {
          const daysAway = (day - today + 7) % 7;
          if (daysAway < daysUntilNext) {
            daysUntilNext = daysAway;
          }
        }
        
        if (daysUntilNext === 0) {
          // Today is a medication day, find the next time today
          const foundTime = this.findNextTimeToday(schedule.times, now);
          if (foundTime) {
            return foundTime;
          } else {
            // No more times today, find the next day
            daysUntilNext = 7;
            for (const day of schedule.days) {
              const daysAway = (day - today + 7) % 7;
              if (daysAway > 0 && daysAway < daysUntilNext) {
                daysUntilNext = daysAway;
              }
            }
          }
        }
        
        nextReminder.setDate(nextReminder.getDate() + daysUntilNext);
        nextReminder.setHours(schedule.times[0].hour, schedule.times[0].minute, 0, 0);
        return nextReminder;
        
      case 'monthly':
        // Find the next day of the month
        const currentDate = now.getDate();
        let daysUntilNextMonth = 31; // Maximum
        
        for (const day of schedule.days) {
          if (day > currentDate) {
            // Day is later this month
            daysUntilNextMonth = day - currentDate;
            break;
          }
        }
        
        if (daysUntilNextMonth === 31) {
          // No days found later this month, move to next month
          nextReminder.setMonth(nextReminder.getMonth() + 1);
          nextReminder.setDate(schedule.days[0]);
        } else {
          // Day found later this month
          nextReminder.setDate(currentDate + daysUntilNextMonth);
        }
        
        nextReminder.setHours(schedule.times[0].hour, schedule.times[0].minute, 0, 0);
        return nextReminder;
        
      case 'custom':
        // Custom repeating pattern - simplified for now
        nextReminder.setDate(nextReminder.getDate() + 1);
        nextReminder.setHours(schedule.times[0].hour, schedule.times[0].minute, 0, 0);
        return nextReminder;
        
      default:
        // Default to tomorrow same time
        nextReminder.setDate(nextReminder.getDate() + 1);
        return nextReminder;
    }
  }

  private findNextTimeToday(times: { hour: number; minute: number }[], now: Date): Date | null {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    for (const time of times) {
      if (time.hour > currentHour || (time.hour === currentHour && time.minute > currentMinute)) {
        const nextTime = new Date(now);
        nextTime.setHours(time.hour, time.minute, 0, 0);
        return nextTime;
      }
    }
    
    return null; // No more times today
  }
}