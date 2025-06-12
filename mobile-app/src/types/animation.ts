// Animation types for medication reminders
export enum AnimationType {
  PILL = 'pill',
  LIQUID = 'liquid', 
  INJECTION = 'injection',
  INHALER = 'inhaler'
}

export type MedicationType = 'pill' | 'liquid' | 'injection' | 'inhaler';

// Medication taking step props
export interface MedicationTakingStepsProps {
  type: MedicationType;
  onComplete: () => Promise<void>;
  medicationName: string;
  dosage: string;
  instructions: string;
}

// Adherence celebration props
export interface AdherenceCelebrationProps {
  streakDays: number;
  adherencePercentage: number;
  onClose: () => void;
}

// Reminder animation props
export interface ReminderAnimationProps {
  type: AnimationType;
  isActive: boolean;
  onAnimationComplete?: () => void;
}

// Medication dashboard props
export interface MedicationDashboardProps {
  navigateToDetails: (scheduleId: string | number) => void;
}

// Active reminder view props
export interface ActiveReminderViewProps {
  reminderData: {
    id: string;
    medicationName: string;
    dosage: string;
    time: string;
    type: string;
  };
  onTaken: () => void;
  onSkipped: () => void;
  onSnooze: () => void;
}