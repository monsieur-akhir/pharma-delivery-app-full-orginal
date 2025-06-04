import api from './api.service';

/**
 * Interface for medication reminder
 */
export interface Reminder {
  id: number;
  userId: number;
  medicineId: number;
  medicineName: string;
  dosage: string;
  frequency: string; // e.g. "daily", "twice-daily", "weekly"
  time: string[]; // Array of times in 24-hour format, e.g. ["08:00", "20:00"]
  startDate: string;
  endDate?: string;
  isActive: boolean;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  notes?: string;
  lastTaken?: string;
  nextDue: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for creating a new reminder
 */
export interface CreateReminderDto {
  medicineId: number;
  medicineName?: string;
  dosage: string;
  frequency: string;
  time: string[];
  startDate: string;
  endDate?: string;
  daysOfWeek?: number[];
  notes?: string;
}

/**
 * Service for handling medication reminders
 */
class ReminderService {
  /**
   * Get all reminders for the authenticated user
   */
  async getUserReminders() {
    try {
      const response = await api.get('/reminders');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new medication reminder
   * @param reminderData Reminder data
   */
  async createReminder(reminderData: CreateReminderDto) {
    try {
      const response = await api.post('/reminders', reminderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing reminder
   * @param reminderId Reminder ID
   * @param reminderData Updated reminder data
   */
  async updateReminder(reminderId: number, reminderData: Partial<CreateReminderDto>) {
    try {
      const response = await api.put(`/reminders/${reminderId}`, reminderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a reminder
   * @param reminderId Reminder ID
   */
  async deleteReminder(reminderId: number) {
    try {
      const response = await api.delete(`/reminders/${reminderId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark a reminder as taken
   * @param reminderId Reminder ID
   */
  async markReminderAsTaken(reminderId: number) {
    try {
      const response = await api.post(`/reminders/${reminderId}/taken`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get today's reminders for the authenticated user
   */
  async getTodayReminders() {
    try {
      const response = await api.get('/reminders/today');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get upcoming reminders for the next 24 hours
   */
  async getUpcomingReminders() {
    try {
      const response = await api.get('/reminders/upcoming');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ReminderService();