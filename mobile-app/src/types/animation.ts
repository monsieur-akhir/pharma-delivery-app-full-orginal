
export type AnimationType = 'pill' | 'liquid' | 'injection' | 'inhaler' | 'tablet' | 'capsule' | 'topical' | 'drops';

export type MedicationType = 'pill' | 'liquid' | 'injection' | 'inhaler';

export interface MedicationTakingStepsProps {
  type: MedicationType;
  onComplete?: () => void;
  isVisible?: boolean;
}

export interface AdherenceCelebrationProps {
  streak: number;
  adherencePercentage: number;
  onClose: () => void;
  visible?: boolean;
}

export interface ReminderAnimationProps {
  isVisible: boolean;
  onClose: () => void;
  medicationName?: string;
  dosage?: string;
  time?: string;
}

export interface MedicationScheduleProgressProps {
  schedule: any[];
  currentTime: Date;
  onMedicationTake?: (medicationId: string) => void;
}

export interface MedicationImpactVisualizationProps {
  medicationType: AnimationType;
  bodyPart?: string;
  effectDuration?: number;
  isVisible?: boolean;
}

export const AnimationConfig = {
  pill: {
    duration: 2000,
    color: '#FF6B6B',
    size: 40,
  },
  liquid: {
    duration: 3000,
    color: '#4ECDC4',
    size: 50,
  },
  injection: {
    duration: 1500,
    color: '#45B7D1',
    size: 45,
  },
  inhaler: {
    duration: 2500,
    color: '#96CEB4',
    size: 55,
  },
  tablet: {
    duration: 2000,
    color: '#FECA57',
    size: 35,
  },
  capsule: {
    duration: 2200,
    color: '#FF9FF3',
    size: 42,
  },
  topical: {
    duration: 4000,
    color: '#54A0FF',
    size: 60,
  },
  drops: {
    duration: 1800,
    color: '#5F27CD',
    size: 30,
  },
};
