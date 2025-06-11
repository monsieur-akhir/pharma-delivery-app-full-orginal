import { useState, useEffect } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimationType } from '../animations';
import { API_BASE_URL } from '../../../config/index';
import ApiService from '../../../services/api.service';

// Types for medication reminders
export interface MedicationReminder {
  id: string | number;
  medicationId: string | number;
  medicationName: string;
  dosage: string;
  type: AnimationType;
  scheduledTime: Date;
  taken: boolean;
  instructions?: string;
  color?: string;
  streak_days?: number;
}

export interface MedicationSchedule {
  id: string | number;
  medicationName: string;
  dosage: string;
  type: AnimationType;
  reminders: MedicationReminder[];
  adherenceRate: number; // 0 to 1
  instructions?: string;
  color?: string;
  streakDays: number;
}

export interface ReminderNotification {
  id: string | number;
  title: string;
  body: string;
  data: {
    medicationId: string | number;
    reminderId: string | number;
    scheduledTime: string;
    type: AnimationType;
  };
}

// Mock functions for local reminder storage
// In a real app, these would use AsyncStorage or another storage mechanism
const saveReminderToStorage = async (reminder: MedicationReminder): Promise<void> => {
  console.log('Saving reminder to storage:', reminder);
  // Implementation would use AsyncStorage
};

const getReminderFromStorage = async (reminderId: string | number): Promise<MedicationReminder | null> => {
  console.log('Getting reminder from storage:', reminderId);
  // Implementation would use AsyncStorage
  return null;
};

const getAllRemindersFromStorage = async (): Promise<MedicationReminder[]> => {
  console.log('Getting all reminders from storage');
  // Implementation would use AsyncStorage
  return [];
};

/**
 * Hook to manage medication reminders
 */
export const useReminders = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [upcomingReminder, setUpcomingReminder] = useState<MedicationReminder | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate adherence rate based on taken reminders
  const calculateAdherenceRate = (medicationReminders: MedicationReminder[]): number => {
    if (medicationReminders.length === 0) return 0;
    
    const takenCount = medicationReminders.filter(r => r.taken).length;
    return takenCount / medicationReminders.length;
  };
  
  // Find the upcoming reminder
  const findUpcomingReminder = (medicationReminders: MedicationReminder[]): void => {
    const now = new Date();
    const upcomingReminders = medicationReminders
      .filter(r => !r.taken && r.scheduledTime > now)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    
    const pastDueReminders = medicationReminders
      .filter(r => !r.taken && r.scheduledTime <= now)
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
    
    if (upcomingReminders.length > 0) {
      setUpcomingReminder(upcomingReminders[0]);
    } else if (pastDueReminders.length > 0) {
      setUpcomingReminder(pastDueReminders[0]);
    } else {
      setUpcomingReminder(null);
    }
  };
  
  // Fetch reminders from API
  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ApiService.getActiveReminders();

      if (response && response.status === 'success' && response.data) {
        const transformedReminders = response.data.map((item: any) => ({
          id: item.id,
          medicationId: item.medicine_id,
          medicationName: item.medicine_name,
          dosage: item.dosage,
          type: getMedicationType(item.medicine_type),
          scheduledTime: new Date(item.next_reminder),
          taken: false,
          instructions: item.instructions,
          color: getColorForMedicationType(getMedicationType(item.medicine_type)),
          streak_days: item.streak_days,
        }));

        setReminders(transformedReminders);

        const medicationMap = new Map<string | number, MedicationReminder[]>();
        transformedReminders.forEach((reminder: MedicationReminder) => {
          if (!medicationMap.has(reminder.medicationId)) {
            medicationMap.set(reminder.medicationId, []);
          }
          medicationMap.get(reminder.medicationId)?.push(reminder);
        });

        const medicationSchedules: MedicationSchedule[] = [];
        medicationMap.forEach((medicationReminders, medicationId) => {
          if (medicationReminders.length > 0) {
            const firstReminder = medicationReminders[0];
            medicationSchedules.push({
              id: medicationId,
              medicationName: firstReminder.medicationName,
              dosage: firstReminder.dosage,
              type: firstReminder.type,
              reminders: medicationReminders,
              adherenceRate: calculateAdherenceRate(medicationReminders),
              instructions: firstReminder.instructions,
              color: firstReminder.color,
              streakDays: response.data.find((item: any) => item.medicine_id === medicationId)?.streak_days || 0,
            });
          }
        });

        setSchedules(medicationSchedules);
        findUpcomingReminder(transformedReminders);
      } else {
        throw new Error(response?.message || 'Failed to fetch reminders');
      }
    } catch (err: any) {
      console.error('Error fetching reminders:', err);
      setError(err.message || 'Failed to fetch reminders');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mark a reminder as taken
  const markReminderAsTaken = async (reminderId: string | number) => {
    try {
      const response = await ApiService.markReminderAsTaken(reminderId);
      
      if (response.status === 'success') {
        // Update local state
        setReminders(prev => prev.map(r => 
          r.id === reminderId ? { ...r, taken: true } : r
        ));
        
        // Update schedules
        setSchedules(prev => prev.map(schedule => {
          const updatedReminders = schedule.reminders.map(r => 
            r.id === reminderId ? { ...r, taken: true } : r
          );
          
          return {
            ...schedule,
            reminders: updatedReminders,
            adherenceRate: calculateAdherenceRate(updatedReminders),
          };
        }));
        
        // Update upcoming reminder
        findUpcomingReminder(
          reminders.map(r => r.id === reminderId ? { ...r, taken: true } : r)
        );
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to mark reminder as taken');
      }
    } catch (err: any) {
      console.error('Error marking reminder as taken:', err);
      setError(err.message || 'Failed to mark reminder as taken');
      return false;
    }
  };
  
  // Skip a reminder
  const skipReminder = async (reminderId: string | number) => {
    try {
      // For now, use direct fetch as ApiService doesn't have skipReminder method
      const userData = await AsyncStorage.getItem('@user_data');
      const token = await AsyncStorage.getItem('@auth_token');
      
      if (!userData || !token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to skip reminder');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state to remove this reminder
        setReminders(prev => prev.filter(r => r.id !== reminderId));
        
        // Update schedules
        setSchedules(prev => prev.map(schedule => {
          const updatedReminders = schedule.reminders.filter(r => r.id !== reminderId);
          
          return {
            ...schedule,
            reminders: updatedReminders,
            adherenceRate: calculateAdherenceRate(updatedReminders),
          };
        }));
        
        // Filter out empty schedules
        setSchedules(prev => prev.filter(s => s.reminders.length > 0));
        
        // Update upcoming reminder
        findUpcomingReminder(reminders.filter(r => r.id !== reminderId));
        
        return true;
      } else {
        throw new Error(data.message || 'Failed to skip reminder');
      }
    } catch (err: any) {
      console.error('Error skipping reminder:', err);
      setError(err.message || 'Failed to skip reminder');
      return false;
    }
  };
  
  // Check for reminders when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchReminders();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Initial fetch
    fetchReminders();
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  return {
    isLoading,
    reminders,
    schedules,
    upcomingReminder,
    error,
    fetchReminders,
    markReminderAsTaken,
    skipReminder,
  };
};

// Helper function to determine medication type from API data
export const getMedicationType = (typeString: string): AnimationType => {
  switch (typeString?.toLowerCase()) {
    case 'pill':
    case 'tablet':
    case 'capsule':
      return AnimationType.PILL;
    case 'liquid':
    case 'syrup':
    case 'solution':
      return AnimationType.LIQUID;
    case 'injection':
    case 'shot':
      return AnimationType.INJECTION;
    case 'topical':
    case 'cream':
    case 'ointment':
      return AnimationType.TOPICAL;
    case 'inhaler':
    case 'nebulizer':
      return AnimationType.INHALER;
    default:
      return AnimationType.PILL;
  }
};

// Helper function to get color based on medication type
export const getColorForMedicationType = (type: AnimationType): string => {
  switch (type) {
    case AnimationType.PILL:
      return '#FF5733';
    case AnimationType.LIQUID:
      return '#4CA6FF';
    case AnimationType.INJECTION:
      return '#FF4CAA';
    case AnimationType.TOPICAL:
      return '#4CFF7B';
    case AnimationType.INHALER:
      return '#D94CFF';
    default:
      return '#FF5733';
  }
};

export default {
  useReminders,
  getMedicationType,
  getColorForMedicationType,
};