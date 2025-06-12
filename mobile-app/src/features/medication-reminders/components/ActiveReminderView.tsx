import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';

import { ReminderAnimation, MedicationTakingSteps } from '../animations';
import { MedicationReminder, useReminders } from '../services/ReminderService';

interface ActiveReminderViewProps {
  onComplete?: () => void;
}

/**
 * Component that shows the currently active medication reminder with animations
 */
const ActiveReminderView: React.FC<ActiveReminderViewProps> = ({ onComplete }) => {
  const {
    isLoading,
    upcomingReminder,
    error,
    markReminderAsTaken,
    skipReminder,
    fetchReminders,
  } = useReminders();

  const [showAnimation, setShowAnimation] = useState(false);
  const [showTakingSteps, setShowTakingSteps] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<MedicationReminder | null>(null);

  // Show animation for upcoming reminder if it's time or past due
  useEffect(() => {
    if (upcomingReminder) {
      const now = new Date();
      const reminderTime = new Date(upcomingReminder.scheduledTime);
      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime()) / 60000; // diff in minutes

      // Show animation if it's within 5 minutes of the scheduled time or past due
      if (timeDiff <= 5 || reminderTime < now) {
        setSelectedReminder(upcomingReminder);
        setShowAnimation(true);
      }
    }
  }, [upcomingReminder]);

  // Handle marking a reminder as taken
  const handleTaken = async () => {
    if (!selectedReminder) return;

    // Hide animation and show steps
    setShowAnimation(false);
    setShowTakingSteps(true);
  };

  // Handle completing medication taking steps
  const handleStepsComplete = async () => {
    if (!selectedReminder) return;

    try {
      const success = await markReminderAsTaken(selectedReminder.id);

      if (success) {
        // Clear selected reminder and close the steps view
        setSelectedReminder(null);
        setShowTakingSteps(false);

        // Fetch updated reminders
        fetchReminders();

        // Notify parent component
        if (onComplete) {
          onComplete();
        }
      } else {
        Alert.alert(
          'Error',
          'Failed to mark medication as taken. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error completing medication steps:', error);
    }
  };

  // Handle dismissing a reminder
  const handleDismiss = async () => {
    if (!selectedReminder) return;

    Alert.alert(
      'Skip Medication',
      'Are you sure you want to skip this medication? This will affect your adherence record.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await skipReminder(selectedReminder.id);

              if (success) {
                // Clear selected reminder and close animations
                setSelectedReminder(null);
                setShowAnimation(false);
                setShowTakingSteps(false);

                // Fetch updated reminders
                fetchReminders();
              } else {
                Alert.alert(
                  'Error',
                  'Failed to skip medication. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Error skipping medication:', error);
            }
          },
        },
      ]
    );
  };

  // Handle manually checking for due reminders
  const checkForDueReminders = () => {
    fetchReminders();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Checking for medication reminders...</Text>
      </View>
    );
  }

  if (error) {
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

  if (!upcomingReminder && !showAnimation && !showTakingSteps) {
    return (
      <View style={styles.noReminderContainer}>
        <Text style={styles.noReminderText}>No upcoming medication reminders.</Text>
        <TouchableOpacity
          style={styles.checkButton}
          onPress={checkForDueReminders}
        >
          <Text style={styles.checkButtonText}>Check Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAnimation && selectedReminder && (
        <ReminderAnimation
          type={selectedReminder.type}
          reminderText={`Time to take your ${selectedReminder.medicationName}`}
          onComplete={handleTaken}
          onDismiss={handleDismiss}
          medicationName={selectedReminder.medicationName}
          dosage={selectedReminder.dosage}
          instructions={selectedReminder.instructions || ''}
          color={selectedReminder.color}
        />
      )}

      {showTakingSteps && selectedReminder && (
        <View style={styles.fullScreenContainer}>
          <MedicationTakingSteps
            type={selectedReminder.type}
            onComplete={handleStepsComplete}
            medicationName={selectedReminder.medicationName}
            dosage={selectedReminder.dosage}
            instructions={selectedReminder.instructions || ''}
          />
        </View>
      )}

      {!showAnimation && !showTakingSteps && upcomingReminder && (
        <View style={styles.upcomingReminderContainer}>
          <Text style={styles.upcomingReminderTitle}>Upcoming Medication:</Text>
          <Text style={styles.medicationName}>{upcomingReminder.medicationName}</Text>
          <Text style={styles.medicationDetails}>
            {upcomingReminder.dosage} at{' '}
            {new Date(upcomingReminder.scheduledTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          <TouchableOpacity
            style={styles.takeMedicationButton}
            onPress={() => {
              setSelectedReminder(upcomingReminder);
              setShowAnimation(true);
            }}
          >
            <Text style={styles.takeMedicationButtonText}>Take Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8f8f8',
    zIndex: 1000,
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
  noReminderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noReminderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  checkButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  upcomingReminderContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  upcomingReminderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 5,
  },
  medicationDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  takeMedicationButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  takeMedicationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ActiveReminderView;