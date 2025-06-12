
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AdherenceCelebration from '../animations/AdherenceCelebration';

export interface MedicationSchedule {
  id: string | number;
  medicationName: string;
  dosage: string;
  type: 'pill' | 'liquid' | 'injection' | 'inhaler';
  reminders: MedicationReminder[];
  adherenceRate: number;
  instructions: string;
  color: string;
  streakDays: number;
}

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

interface MedicationDashboardProps {
  schedules: MedicationSchedule[];
  onSchedulePress: (schedule: MedicationSchedule) => void;
  onAddSchedule: () => void;
}

const MedicationDashboard: React.FC<MedicationDashboardProps> = ({
  schedules,
  onSchedulePress,
  onAddSchedule,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate overall adherence rate
  const overallAdherence = schedules.length > 0
    ? schedules.reduce((sum, schedule) => sum + schedule.adherenceRate, 0) / schedules.length
    : 0;

  // Find schedule with highest streak
  const highestStreakSchedule = schedules.length > 0
    ? schedules.reduce((prev, current) => {
        if (!prev) return current;
        return current.streakDays > prev.streakDays ? current : prev;
      })
    : null;

  // Find schedule with highest adherence
  const highestAdherenceSchedule = schedules.length > 0
    ? schedules.reduce((prev, current) => {
        if (!prev) return current;
        return current.adherenceRate > prev.adherenceRate ? current : prev;
      })
    : null;

  // Check for celebration triggers
  const shouldCelebrate = schedules.length > 0 && (
    (highestStreakSchedule && highestStreakSchedule.streakDays >= 7 && highestStreakSchedule.streakDays % 7 === 0) ||
    (highestAdherenceSchedule && highestAdherenceSchedule.adherenceRate >= 0.9 && highestAdherenceSchedule.reminders.length >= 10)
  );

  useEffect(() => {
    if (shouldCelebrate) {
      if (highestStreakSchedule && highestAdherenceSchedule) {
        if (highestStreakSchedule.streakDays >= highestAdherenceSchedule.adherenceRate * 100) {
          setShowCelebration(true);
        }
      }
    }
  }, [shouldCelebrate, highestStreakSchedule, highestAdherenceSchedule]);

  const getAdherenceColor = (rate: number) => {
    if (rate >= 0.9) return '#4CAF50';
    if (rate >= 0.7) return '#FF9500';
    return '#FF4757';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pill': return 'medication';
      case 'liquid': return 'local-drink';
      case 'injection': return 'medical-services';
      case 'inhaler': return 'air';
      default: return 'medication';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <AdherenceCelebration
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{schedules.length}</Text>
          <Text style={styles.statLabel}>Médicaments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getAdherenceColor(overallAdherence) }]}>
            {(overallAdherence * 100).toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Observance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#4A80F0' }]}>
            {highestStreakSchedule ? highestStreakSchedule.streakDays : 0}
          </Text>
          <Text style={styles.statLabel}>Jours consécutifs</Text>
        </View>
      </View>

      {/* Medication Schedules */}
      <View style={styles.schedulesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Médicaments</Text>
          <TouchableOpacity onPress={onAddSchedule} style={styles.addButton}>
            <MaterialIcons name="add" size={24} color="#4A80F0" />
          </TouchableOpacity>
        </View>

        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="local-pharmacy" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Aucun médicament</Text>
            <Text style={styles.emptyDescription}>
              Ajoutez vos premiers médicaments pour commencer le suivi
            </Text>
            <TouchableOpacity onPress={onAddSchedule} style={styles.emptyAddButton}>
              <Text style={styles.emptyAddButtonText}>Ajouter un médicament</Text>
            </TouchableOpacity>
          </View>
        ) : (
          schedules.map((schedule) => (
            <TouchableOpacity
              key={schedule.id}
              style={styles.scheduleCard}
              onPress={() => onSchedulePress(schedule)}
            >
              <View style={styles.scheduleHeader}>
                <View style={[styles.typeIcon, { backgroundColor: schedule.color + '20' }]}>
                  <MaterialIcons
                    name={getTypeIcon(schedule.type) as any}
                    size={24}
                    color={schedule.color}
                  />
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.medicationName}>{schedule.medicationName}</Text>
                  <Text style={styles.dosage}>{schedule.dosage}</Text>
                </View>
                <View style={styles.adherenceIndicator}>
                  <Text style={[
                    styles.adherenceText,
                    { color: getAdherenceColor(schedule.adherenceRate) }
                  ]}>
                    {(schedule.adherenceRate * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleStats}>
                <View style={styles.stat}>
                  <MaterialIcons name="timeline" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {schedule.streakDays} jour{schedule.streakDays > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <MaterialIcons name="schedule" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {schedule.reminders.length} rappel{schedule.reminders.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${schedule.adherenceRate * 100}%`,
                      backgroundColor: getAdherenceColor(schedule.adherenceRate),
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  schedulesContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#4A80F0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: '#666',
  },
  adherenceIndicator: {
    alignItems: 'center',
  },
  adherenceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scheduleStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default MedicationDashboard;
