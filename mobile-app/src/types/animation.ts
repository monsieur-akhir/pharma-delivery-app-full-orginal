
// Animation types for medication reminders
export enum AnimationType {
  PILL = 'pill',
  LIQUID = 'liquid',
  INJECTION = 'injection',
  TOPICAL = 'topical',
  INHALER = 'inhaler',
  TABLET = 'tablet',
  CAPSULE = 'capsule'
}

// Medication taking step props
export interface MedicationTakingStepsProps {
  type: 'pill' | 'liquid' | 'injection' | 'inhaler';
  onComplete: () => void;
  medicationName: string;
  dosage: string;
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
