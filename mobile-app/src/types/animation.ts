
export enum AnimationType {
  PILL = 'pill',
  LIQUID = 'liquid',
  INJECTION = 'injection',
  TOPICAL = 'topical',
  INHALER = 'inhaler',
  TABLET = 'tablet',
  CAPSULE = 'capsule'
}

export interface AnimationProps {
  type: AnimationType;
  isVisible?: boolean;
  onComplete?: () => void;
  duration?: number;
}

export interface MedicationTakingStepsProps {
  type: 'pill' | 'liquid' | 'injection' | 'inhaler';
  onComplete?: () => void;
}

export interface ReminderAnimationProps {
  type: AnimationType;
  isVisible?: boolean;
  onComplete?: () => void;
}

export interface AdherenceCelebrationProps {
  adherencePercentage: number;
  onClose: () => void;
}

export interface MedicationDashboardProps {
  onMedicationSelect?: (medicationId: string) => void;
}
