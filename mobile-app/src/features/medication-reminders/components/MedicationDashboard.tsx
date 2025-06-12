import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import { MedicationScheduleProgress, AdherenceCelebration } from '../animations';
import { useReminders } from '../services/ReminderService';
import ActiveReminderView from './ActiveReminderView';

interface MedicationDashboardProps {
  userId: number;
  navigateToDetails?: (scheduleId: string | number) => void;
}

/**
 * A comprehensive dashboard showing medication reminders and adherence stats
 */
const MedicationDashboard: React.FC<MedicationDashboardProps> = ({
  userId,
  navigateToDetails,
}) => {
  const {
    isLoading,
    schedules,
    error,
    fetchReminders,
    markReminderAsTaken,
  } = useReminders();

  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // Check for achievements when schedules change
  useEffect(() => {
    if (schedules.length > 0) {
      // Filter out schedules without reminders
      const filteredSchedules = schedules.filter(schedule => schedule.reminders && schedule.reminders.length > 0);

      // If no schedules with reminders, return
      if (filteredSchedules.length === 0) return;

      // Find the schedule with the highest streak
      const highestStreakSchedule = filteredSchedules.reduce(
        (prev, current) => (current.streakDays > (prev?.streakDays || 0) ? current : prev),
        filteredSchedules[0]
      );

      // Find the schedule with the highest adherence
      const highestAdherenceSchedule = filteredSchedules.reduce(
        (prev, current) => (current.adherenceRate > (prev?.adherenceRate || 0) ? current : prev),
        filteredSchedules[0]
      );

      const shouldCelebrate = 
        (highestStreakSchedule?.streakDays >= 7 && highestStreakSchedule?.streakDays % 7 === 0) ||
        (highestAdherenceSchedule?.adherenceRate >= 0.9 && highestAdherenceSchedule?.reminders.length >= 10);

      if (shouldCelebrate && highestStreakSchedule && highestAdherenceSchedule) {
        if (highestStreakSchedule.streakDays >= highestAdherenceSchedule.adherenceRate * 100) {
          setSelectedSchedule(highestStreakSchedule);
        } else {
          setSelectedSchedule(highestAdherenceSchedule);
        }

        // Only show once when the component mounts or data refreshes
        setShowCelebration(true);
      }
    }
  }, [schedules]);

  // Refresh the data
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReminders();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle press on a medication schedule
  const handlePressSchedule = (scheduleId: string | number) => {
    if (navigateToDetails) {
      navigateToDetails(scheduleId);
    }
  };

  // Handle press on a specific dose
  const handlePressDose = async (scheduleId: string | number, doseId: string | number) => {
    // Find the schedule and dose
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const reminder = schedule.reminders.find(r => r.id === doseId);
    if (!reminder) return;

    // If already taken, show message
    if (reminder.taken) {
      Alert.alert(
        'Already Taken',
        `You have already taken this dose of ${schedule.medicationName}.`
      );
      return;
    }

    // Otherwise, prompt to take
    Alert.alert(
      'Take Medication',
      `Do you want to mark this dose of ${schedule.medicationName} as taken?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Take',
          onPress: async () => {
            try {
              await markReminderAsTaken(doseId);
              // Refresh after marking as taken
              fetchReminders();
            } catch (error) {
              console.error('Error marking dose as taken:', error);
              Alert.alert('Error', 'Failed to mark dose as taken');
            }
          },
        },
      ]
    );
  };

  // Calculate overall adherence rate for all medications
  const calculateOverallAdherence = () => {
    if (schedules.length === 0) return 0;

    const total = schedules.reduce((sum, schedule) => sum + schedule.adherenceRate, 0);
    return total / schedules.length;
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading your medication data...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchReminders}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const overallAdherence = calculateOverallAdherence();

  return (
    <View style={styles.container}>
      {/* Active reminder view for upcoming medications */}
      <View style={styles.activeReminderContainer}>
        <ActiveReminderView onComplete={fetchReminders} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Adherence overview */}
        <View style={styles.adherenceContainer}>
          <Text style={styles.sectionTitle}>Medication Adherence</Text>
          <View style={styles.adherenceCard}>
            <Text style={styles.adherenceLabel}>Overall Adherence</Text>
            <Text style={[
              styles.adherenceValue,
              overallAdherence >= 0.9 ? styles.excellentAdherence : 
              overallAdherence >= 0.7 ? styles.goodAdherence : 
              styles.poorAdherence
            ]}>
              {Math.round(overallAdherence * 100)}%
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${Math.round(overallAdherence * 100)}%`,
                    backgroundColor: 
                      overallAdherence >= 0.9 ? '#4CD964' : 
                      overallAdherence >= 0.7 ? '#FFCC00' : 
                      '#FF3B30'
                  }
                ]} 
              />
            </View>
            <Text style={styles.adherenceMessage}>
              {overallAdherence >= 0.9 
                ? 'Excellent! Keep up the good work.' 
                : overallAdherence >= 0.7 
                  ? 'Good progress. Try to be more consistent.' 
                  : 'Needs improvement. Consistent medication is important.'}
            </Text>
          </View>
        </View>

        {/* Medication schedules */}
        <View style={styles.schedulesContainer}>
          <Text style={styles.sectionTitle}>Your Medications</Text>
          {schedules.length > 0 ? (
            <MedicationScheduleProgress
              schedules={schedules.map(schedule => ({
                ...schedule,
                doses: schedule.reminders.map(reminder => ({
                  id: reminder.id,
                  time: new Date(reminder.scheduledTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  taken: reminder.taken,
                  scheduledTime: new Date(reminder.scheduledTime),
                })),
              }))}
              onPressDose={handlePressDose}
              onPressSchedule={handlePressSchedule}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No medication schedules found. Your doctor may prescribe medications later.
              </Text>
            </View>
          )}
        </View>

        {/* Padding at the bottom for better scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Celebration pop-up */}
      {showCelebration && selectedSchedule && (
        <AdherenceCelebration
          streakDays={selectedSchedule.streakDays}
          adherencePercentage={selectedSchedule.adherenceRate * 100}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  activeReminderContainer: {
    height: 120,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adherenceContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  adherenceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adherenceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  adherenceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  excellentAdherence: {
    color: '#4CD964',
  },
  goodAdherence: {
    color: '#FFCC00',
  },
  poorAdherence: {
    color: '#FF3B30',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  adherenceMessage: {
    fontSize: 14,
    color: '#666',
  },
  schedulesContainer: {
    padding: 16,
  },
  emptyStateContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MedicationDashboard;