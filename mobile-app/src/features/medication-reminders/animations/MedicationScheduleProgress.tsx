import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { AnimationType } from './ReminderAnimation';

interface MedicationDose {
  id: string | number;
  time: string;
  taken: boolean;
  scheduledTime: Date;
}

interface MedicationSchedule {
  id: string | number;
  medicationName: string;
  dosage: string;
  type: AnimationType;
  doses: MedicationDose[];
  adherenceRate: number; // 0 to 1
  instructions?: string;
  color?: string;
}

interface MedicationScheduleProgressProps {
  schedules: MedicationSchedule[];
  onPressDose: (scheduleId: string | number, doseId: string | number) => void;
  onPressSchedule: (scheduleId: string | number) => void;
}

// Utility function to format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Utility function to determine if dose is past-due
const isPastDue = (doseTime: Date) => {
  const now = new Date();
  return !doseTime || doseTime < now;
};

// Utility function to get the appropriate icon based on medication type
const getMedicationIcon = (type: AnimationType) => {
  switch (type) {
    case AnimationType.PILL:
      return '💊';
    case AnimationType.LIQUID:
      return '💧';
    case AnimationType.INJECTION:
      return '💉';
    case AnimationType.TOPICAL:
      return '🧴';
    case AnimationType.INHALER:
      return '🌬️';
    default:
      return '💊';
  }
};

/**
 * A component that displays an interactive progress view of medication schedules
 */
const MedicationScheduleProgress: React.FC<MedicationScheduleProgressProps> = ({
  schedules,
  onPressDose,
  onPressSchedule,
}) => {
  // Sort schedules by next dose time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const aNextDose = a.doses.find(d => !d.taken);
    const bNextDose = b.doses.find(d => !d.taken);
    
    if (!aNextDose) return 1;
    if (!bNextDose) return -1;
    
    return aNextDose.scheduledTime.getTime() - bNextDose.scheduledTime.getTime();
  });
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Today's Medication Schedule</Text>
      
      {sortedSchedules.map(schedule => (
        <MedicationCard
          key={schedule.id}
          schedule={schedule}
          onPressDose={onPressDose}
          onPressSchedule={onPressSchedule}
        />
      ))}
    </ScrollView>
  );
};

interface MedicationCardProps {
  schedule: MedicationSchedule;
  onPressDose: (scheduleId: string | number, doseId: string | number) => void;
  onPressSchedule: (scheduleId: string | number) => void;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  schedule,
  onPressDose,
  onPressSchedule,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: schedule.adherenceRate,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [schedule.adherenceRate]);
  
  const progressWidth = Dimensions.get('window').width - 40; // Full width minus padding
  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressWidth - 40], // Subtract padding
  });
  
  const color = schedule.color || '#FF5733';
  const icon = getMedicationIcon(schedule.type);
  
  // Find the next dose that hasn't been taken
  const nextDose = schedule.doses.find(dose => !dose.taken);
  
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: color }]}
      onPress={() => onPressSchedule(schedule.id)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.medicationInfo}>
          <Text style={styles.iconText}>{icon}</Text>
          <View>
            <Text style={styles.medicationName}>{schedule.medicationName}</Text>
            <Text style={styles.dosage}>{schedule.dosage}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.expandButton, expanded && styles.expandButtonActive]}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandButtonText}>
            {expanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Today's Progress:</Text>
          <Text style={styles.progressPercentage}>
            {Math.round(schedule.adherenceRate * 100)}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: animatedWidth, backgroundColor: color },
            ]}
          />
        </View>
      </View>
      
      {nextDose && (
        <View style={styles.nextDoseContainer}>
          <Text style={styles.nextDoseLabel}>Next dose:</Text>
          <Text
            style={[
              styles.nextDoseTime,
              isPastDue(nextDose.scheduledTime) && styles.pastDueText,
            ]}
          >
            {formatTime(nextDose.scheduledTime)}
            {isPastDue(nextDose.scheduledTime) && ' (Past due)'}
          </Text>
        </View>
      )}
      
      {expanded && (
        <View style={styles.dosesContainer}>
          <Text style={styles.dosesTitle}>All Doses</Text>
          
          {schedule.doses.map(dose => (
            <TouchableOpacity
              key={dose.id}
              style={[
                styles.doseItem,
                dose.taken ? styles.doseTaken : styles.doseNotTaken,
                isPastDue(dose.scheduledTime) && !dose.taken && styles.dosePastDue,
              ]}
              onPress={() => onPressDose(schedule.id, dose.id)}
            >
              <Text style={styles.doseTime}>{formatTime(dose.scheduledTime)}</Text>
              <View
                style={[
                  styles.doseStatus,
                  { backgroundColor: dose.taken ? '#4CD964' : '#FF9500' },
                ]}
              >
                <Text style={styles.doseStatusText}>
                  {dose.taken ? 'Taken' : 'Not Taken'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    marginRight: 10,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dosage: {
    fontSize: 14,
    color: '#666',
  },
  expandButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eaeaea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonActive: {
    backgroundColor: '#ddd',
  },
  expandButtonText: {
    color: '#666',
    fontSize: 12,
  },
  progressSection: {
    marginTop: 5,
    marginBottom: 10,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#eaeaea',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  nextDoseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  nextDoseLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  nextDoseTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  pastDueText: {
    color: '#FF3B30',
  },
  dosesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  dosesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  doseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  doseTaken: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  doseNotTaken: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  dosePastDue: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  doseTime: {
    fontSize: 14,
    color: '#333',
  },
  doseStatus: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  doseStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MedicationScheduleProgress;