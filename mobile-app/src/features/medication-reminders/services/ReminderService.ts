import { AnimationType } from '../../../types/animation';

export interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  adherenceRate: number;
}

export interface MedicationSchedule {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: number;
  interval: 'daily' | 'weekly' | 'monthly';
  times: string[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  reminders: MedicationReminder[];
  adherenceData: {
    taken: number;
    missed: number;
    total: number;
    percentage: number;
  };
}

export interface AdherenceEntry {
  id: string;
  scheduleId: string;
  plannedTime: Date;
  actualTime?: Date;
  status: 'taken' | 'missed' | 'skipped' | 'snoozed';
  notes?: string;
}

class ReminderService {
  private schedules: MedicationSchedule[] = [];
  private adherenceEntries: AdherenceEntry[] = [];

  // Get all medication schedules
  getMedicationSchedules(): MedicationSchedule[] {
    return this.schedules;
  }

  // Get active reminders for today
  getTodaysReminders(): MedicationReminder[] {
    const today = new Date();
    const todayStr = today.toDateString();

    return this.schedules
      .filter(schedule => schedule.isActive)
      .flatMap(schedule => schedule.reminders)
      .filter(reminder => {
        const reminderDate = new Date(reminder.startDate);
        return reminderDate.toDateString() === todayStr;
      });
  }

  // Get upcoming reminders
  getUpcomingReminders(hours: number = 24): MedicationReminder[] {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.schedules
      .filter(schedule => schedule.isActive)
      .flatMap(schedule => schedule.reminders)
      .filter(reminder => {
        const reminderDate = new Date(reminder.startDate);
        return reminderDate >= now && reminderDate <= futureTime;
      });
  }

  // Mark medication as taken
  markMedicationTaken(reminderId: string, actualTime?: Date): void {
    const adherenceEntry: AdherenceEntry = {
      id: Date.now().toString(),
      scheduleId: reminderId,
      plannedTime: new Date(),
      actualTime: actualTime || new Date(),
      status: 'taken',
    };

    this.adherenceEntries.push(adherenceEntry);
    this.updateAdherenceRates();
  }

  // Mark medication as missed
  markMedicationMissed(reminderId: string): void {
    const adherenceEntry: AdherenceEntry = {
      id: Date.now().toString(),
      scheduleId: reminderId,
      plannedTime: new Date(),
      status: 'missed',
    };

    this.adherenceEntries.push(adherenceEntry);
    this.updateAdherenceRates();
  }

  // Skip medication dose
  skipMedication(reminderId: string, reason?: string): void {
    const adherenceEntry: AdherenceEntry = {
      id: Date.now().toString(),
      scheduleId: reminderId,
      plannedTime: new Date(),
      status: 'skipped',
      notes: reason,
    };

    this.adherenceEntries.push(adherenceEntry);
    this.updateAdherenceRates();
  }

  // Snooze reminder
  snoozeReminder(reminderId: string, minutes: number = 15): void {
    const adherenceEntry: AdherenceEntry = {
      id: Date.now().toString(),
      scheduleId: reminderId,
      plannedTime: new Date(Date.now() + minutes * 60 * 1000),
      status: 'snoozed',
    };

    this.adherenceEntries.push(adherenceEntry);
  }

  // Get adherence statistics
  getAdherenceStats(scheduleId?: string): {
    taken: number;
    missed: number;
    skipped: number;
    total: number;
    percentage: number;
  } {
    let entries = this.adherenceEntries;

    if (scheduleId) {
      entries = entries.filter(entry => entry.scheduleId === scheduleId);
    }

    const taken = entries.filter(entry => entry.status === 'taken').length;
    const missed = entries.filter(entry => entry.status === 'missed').length;
    const skipped = entries.filter(entry => entry.status === 'skipped').length;
    const total = entries.length;
    const percentage = total > 0 ? (taken / total) * 100 : 0;

    return { taken, missed, skipped, total, percentage };
  }

  // Create new medication schedule
  createMedicationSchedule(
    medicationName: string,
    dosage: string,
    frequency: number,
    interval: 'daily' | 'weekly' | 'monthly',
    times: string[],
    startDate: Date,
    endDate?: Date
  ): MedicationSchedule {
    const schedule: MedicationSchedule = {
      id: Date.now().toString(),
      medicationName,
      dosage,
      frequency,
      interval,
      times,
      startDate,
      endDate,
      isActive: true,
      reminders: [],
      adherenceData: {
        taken: 0,
        missed: 0,
        total: 0,
        percentage: 0,
      },
    };

    this.schedules.push(schedule);
    this.generateReminders(schedule);

    return schedule;
  }

  // Generate reminders for a schedule
  private generateReminders(schedule: MedicationSchedule): void {
    const reminders: MedicationReminder[] = [];
    const currentDate = new Date(schedule.startDate);
    const endDate = schedule.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    while (currentDate <= endDate) {
      schedule.times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const reminderDate = new Date(currentDate);
        reminderDate.setHours(hours, minutes, 0, 0);

        const reminder: MedicationReminder = {
          id: `${schedule.id}_${reminderDate.getTime()}`,
          medicationName: schedule.medicationName,
          dosage: schedule.dosage,
          frequency: `${schedule.frequency} times ${schedule.interval}`,
          times: [time],
          startDate: reminderDate,
          endDate: reminderDate,
          isActive: true,
          adherenceRate: 0,
        };

        reminders.push(reminder);
      });

      // Advance date based on interval
      if (schedule.interval === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (schedule.interval === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (schedule.interval === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    schedule.reminders = reminders;
  }

  // Update adherence rates
  private updateAdherenceRates(): void {
    this.schedules.forEach(schedule => {
      const stats = this.getAdherenceStats(schedule.id);
      schedule.adherenceData = stats;

      schedule.reminders.forEach(reminder => {
        const reminderEntries = this.adherenceEntries.filter(
          entry => entry.scheduleId === reminder.id
        );
        const taken = reminderEntries.filter(entry => entry.status === 'taken').length;
        const total = reminderEntries.length;
        reminder.adherenceRate = total > 0 ? (taken / total) * 100 : 0;
      });
    });
  }

  // Get animation type based on medication type
  getAnimationType(medicationType: string): AnimationType {
    switch (medicationType.toLowerCase()) {
      case 'pill':
      case 'tablet':
        return AnimationType.PILL;
      case 'capsule':
        return AnimationType.PILL;
      case 'liquid':
      case 'syrup':
        return AnimationType.LIQUID;
      case 'injection':
      case 'shot':
        return AnimationType.INJECTION;
      case 'cream':
      case 'ointment':
        return AnimationType.PILL;
      case 'inhaler':
      case 'spray':
        return AnimationType.INHALER;
      default:
        return AnimationType.PILL;
    }
  }

  // Get medication instructions based on type
  getMedicationInstructions(type: AnimationType): string[] {
    switch (type) {
      case AnimationType.PILL:
        return ['Take with water', 'Swallow whole', 'Do not chew'];
      case AnimationType.LIQUID:
        return ['Measure carefully', 'Use provided measuring cup', 'Shake well before use'];
      case AnimationType.INJECTION:
        return ['Clean injection site', 'Use sterile technique', 'Dispose of needle safely'];
      // case AnimationType.TOPICAL:
      //   return ['Clean area first', 'Apply thin layer', 'Wash hands after application'];
      case AnimationType.INHALER:
        return ['Shake before use', 'Exhale fully', 'Press and inhale slowly'];
      default:
        return ['Follow doctor\'s instructions'];
    }
  }
}

export const reminderService = new ReminderService();
export default reminderService;