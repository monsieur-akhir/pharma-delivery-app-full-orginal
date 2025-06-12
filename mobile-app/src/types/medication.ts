export interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions?: string;
  type: 'pill' | 'liquid' | 'injection' | 'inhaler';
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  instructions?: string;
  type: 'pill' | 'liquid' | 'injection' | 'inhaler';
  reminders: MedicationReminder[];
}

export interface MedicationReminder {
  id: string;
  scheduleId: string;
  time: string;
  taken: boolean;
  skipped: boolean;
  date: string;
}

export interface ReminderData {
  id: string;
  medicationName: string;
  dosage: string;
  time: string;
  type: string;
  instructions?: string;
}