import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ReminderAnimation from '../animations/ReminderAnimation';
import MedicationTakingSteps from '../animations/MedicationTakingSteps';
import AdherenceCelebration from '../animations/AdherenceCelebration';

export interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  scheduledTime: Date;
  type: 'pill' | 'liquid' | 'injection' | 'inhaler';
  instructions?: string;
  color?: string;
  isOverdue: boolean;
  timeUntilNext?: string;
}

export type AnimationType = 'pill' | 'liquid' | 'injection' | 'inhaler' | 'tablet' | 'capsule';

export interface ReminderAnimationProps {
  type: AnimationType;
  reminderText: string;
  onComplete: () => Promise<void>;
  onDismiss: () => Promise<void>;
  medicationName: string;
  dosage: string;
  instructions: string;
  color: string;
}

export interface MedicationTakingStepsProps {
  type: AnimationType;
  onComplete: () => Promise<void>;
  medicationName: string;
  dosage: string;
  instructions: string;
}

interface ActiveReminderViewProps {
  reminder: MedicationReminder | null;
  onMarkAsTaken: (reminderId: string) => Promise<void>;
  onSnooze: (reminderId: string, minutes: number) => Promise<void>;
  onDismiss: (reminderId: string) => Promise<void>;
}

const ActiveReminderView: React.FC<ActiveReminderViewProps> = ({
  reminder,
  onMarkAsTaken,
  onSnooze,
  onDismiss,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [animationType, setAnimationType] = useState<AnimationType>('pill');

  useEffect(() => {
    if (reminder) {
      setAnimationType(reminder.type);
      setShowAnimation(true);
    }
  }, [reminder]);

  const handleMarkAsTaken = async () => {
    if (!reminder) return;

    try {
      await onMarkAsTaken(reminder.id);
      setShowAnimation(false);
      setShowSteps(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer le médicament comme pris');
    }
  };

  const handleSnooze = async (minutes: number) => {
    if (!reminder) return;

    try {
      await onSnooze(reminder.id, minutes);
      setShowAnimation(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de reporter le rappel');
    }
  };

  const handleDismiss = async () => {
    if (!reminder) return;

    try {
      await onDismiss(reminder.id);
      setShowAnimation(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer le rappel');
    }
  };

  const handleStepsComplete = async () => {
    setShowSteps(false);
    setShowCelebration(true);

    // Hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!reminder) {
    return null;
  }

  if (showCelebration) {
    return (
      <AdherenceCelebration
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    );
  }

  if (showSteps) {
    return (
      <View style={styles.container}>
        <MedicationTakingSteps
          type={animationType}
          onComplete={handleStepsComplete}
          medicationName={reminder.medicationName}
          dosage={reminder.dosage}
          instructions={reminder.instructions || ''}
        />
      </View>
    );
  }

  if (showAnimation) {
    return (
      <View style={styles.container}>
        <ReminderAnimation
          type={animationType}
          reminderText={`Il est temps de prendre ${reminder.medicationName}`}
          onComplete={handleMarkAsTaken}
          onDismiss={handleDismiss}
          medicationName={reminder.medicationName}
          dosage={reminder.dosage}
          instructions={reminder.instructions || ''}
          color={reminder.color || '#4A80F0'}
        />
      </View>
    );
  }

  return (
    <View style={styles.reminderCard}>
      <View style={styles.reminderHeader}>
        <View style={[styles.timeIndicator, { backgroundColor: reminder.color || '#4A80F0' }]}>
          <MaterialIcons name="schedule" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.reminderInfo}>
          <Text style={styles.medicationName}>{reminder.medicationName}</Text>
          <Text style={styles.dosage}>{reminder.dosage}</Text>
          <Text style={[styles.time, reminder.isOverdue && styles.overdueTime]}>
            {reminder.isOverdue ? 'En retard' : formatTime(reminder.scheduledTime)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {reminder.isOverdue ? 'RETARD' : 'MAINTENANT'}
          </Text>
        </View>
      </View>

      {reminder.instructions && (
        <View style={styles.instructionsContainer}>
          <MaterialIcons name="info" size={16} color="#666" />
          <Text style={styles.instructions}>{reminder.instructions}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.snoozeButton]}
          onPress={() => handleSnooze(15)}
        >
          <MaterialIcons name="snooze" size={20} color="#FF9500" />
          <Text style={[styles.actionButtonText, { color: '#FF9500' }]}>
            Reporter 15min
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.takenButton]}
          onPress={handleMarkAsTaken}
        >
          <MaterialIcons name="check" size={20} color="#4CAF50" />
          <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>
            Pris
          </Text>
        </TouchableOpacity>
      </View>

      {reminder.timeUntilNext && (
        <Text style={styles.nextReminder}>
          Prochain rappel dans {reminder.timeUntilNext}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A80F0',
  },
  overdueTime: {
    color: '#FF4757',
  },
  statusBadge: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  snoozeButton: {
    backgroundColor: '#FFF5E6',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  takenButton: {
    backgroundColor: '#F0F9F0',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  nextReminder: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ActiveReminderView;