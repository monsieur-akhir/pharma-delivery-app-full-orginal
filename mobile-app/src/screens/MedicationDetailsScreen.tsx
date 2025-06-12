import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BodySystem, MedicationImpactVisualization } from '../features/medication-reminders/animations';
import { useReminders } from '../features/medication-reminders/services/ReminderService';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

type MedicationDetailsRouteProp = RouteProp<{ MedicationDetails: { scheduleId: string } }, 'MedicationDetails'>;

/**
 * Screen for displaying detailed information about a specific medication
 */
const MedicationDetailsScreen: React.FC = () => {
  const route = useRoute<MedicationDetailsRouteProp>();
  const navigation = useNavigation();
  
  // Get the schedule ID from the route params
  const scheduleId = route.params?.scheduleId;
  
  // Get reminders data
  const { schedules, isLoading, error } = useReminders();
  
  // State for impact visualization
  const [showImpactVisualization, setShowImpactVisualization] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  
  // Find the selected schedule
  useEffect(() => {
    if (schedules && schedules.length > 0 && scheduleId) {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule) {
        setSelectedSchedule(schedule);
      }
    }
  }, [schedules, scheduleId]);
  
  // Mock medication effects based on medication type
  const getMedicationEffects = () => {
    if (!selectedSchedule) return [];
    
    // In a real app, this data would come from a medical API or database
    switch (selectedSchedule.type) {
      case 'pill':
        return [
          {
            description: 'Reduces blood pressure by relaxing blood vessels',
            bodySystem: BodySystem.CARDIOVASCULAR,
            timeframe: '2-4 weeks',
            positiveEffect: true,
          },
          {
            description: 'May cause occasional dizziness due to lowered blood pressure',
            bodySystem: BodySystem.CARDIOVASCULAR,
            timeframe: 'Within hours of taking medication',
            positiveEffect: false,
          },
          {
            description: 'May cause a dry cough in some patients',
            bodySystem: BodySystem.RESPIRATORY,
            timeframe: 'Typically within 1-2 weeks',
            positiveEffect: false,
          },
          {
            description: 'Protects kidneys from damage in some patients',
            bodySystem: BodySystem.DIGESTIVE,
            timeframe: 'Long-term effect over months to years',
            positiveEffect: true,
          },
        ];
      case 'liquid':
        return [
          {
            description: 'Provides relief from stomach acid reflux',
            bodySystem: BodySystem.DIGESTIVE,
            timeframe: '30 minutes to 2 hours',
            positiveEffect: true,
          },
          {
            description: 'May cause constipation in some patients',
            bodySystem: BodySystem.DIGESTIVE,
            timeframe: 'Within days of regular use',
            positiveEffect: false,
          },
          {
            description: 'Prevents damage to esophagus tissue',
            bodySystem: BodySystem.DIGESTIVE,
            timeframe: 'Over weeks of consistent use',
            positiveEffect: true,
          },
        ];
      case 'inhaler':
        return [
          {
            description: 'Rapidly opens airways during asthma symptoms',
            bodySystem: BodySystem.RESPIRATORY,
            timeframe: '5-10 minutes',
            positiveEffect: true,
          },
          {
            description: 'May cause increased heart rate temporarily',
            bodySystem: BodySystem.CARDIOVASCULAR,
            timeframe: 'Immediately after use',
            positiveEffect: false,
          },
          {
            description: 'Reduces inflammation in bronchial tubes',
            bodySystem: BodySystem.RESPIRATORY,
            timeframe: 'With consistent use over days',
            positiveEffect: true,
          },
          {
            description: 'May cause mild tremors in some patients',
            bodySystem: BodySystem.NERVOUS,
            timeframe: 'Shortly after use',
            positiveEffect: false,
          },
        ];
      default:
        return [
          {
            description: 'Provides therapeutic benefits',
            bodySystem: BodySystem.IMMUNE,
            timeframe: 'Varies',
            positiveEffect: true,
          },
          {
            description: 'May have side effects',
            bodySystem: BodySystem.DIGESTIVE,
            timeframe: 'Varies',
            positiveEffect: false,
          },
        ];
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading medication details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!selectedSchedule) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Medication not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Details</Text>
        <View style={styles.backButton} />
      </View>
      
      {showImpactVisualization ? (
        <MedicationImpactVisualization
          medicationName={selectedSchedule.medicationName}
          medicationType={selectedSchedule.type}
          effects={getMedicationEffects()}
          adherence={selectedSchedule.adherenceRate}
          onClose={() => setShowImpactVisualization(false)}
        />
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.medicationHeader}>
            <Text style={styles.medicationName}>{selectedSchedule.medicationName}</Text>
            <Text style={styles.medicationDosage}>{selectedSchedule.dosage}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication Schedule</Text>
            <View style={styles.scheduleCard}>
              <View style={styles.adherenceRow}>
                <Text style={styles.adherenceLabel}>Your Adherence</Text>
                <Text style={[
                  styles.adherenceValue,
                  selectedSchedule.adherenceRate >= 0.9 ? styles.excellentAdherence : 
                  selectedSchedule.adherenceRate >= 0.7 ? styles.goodAdherence : 
                  styles.poorAdherence
                ]}>
                  {Math.round(selectedSchedule.adherenceRate * 100)}%
                </Text>
              </View>
              
              <View style={styles.streakRow}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakValue}>{selectedSchedule.streakDays} days</Text>
              </View>
              
              <Text style={styles.reminderTitle}>Today's Reminder Times:</Text>
              {selectedSchedule.reminders.map((reminder: { scheduledTime: string; taken: boolean }, index: number) => (
                <View key={index} style={styles.reminderItem}>
                  <Text style={styles.reminderTime}>
                    {new Date(reminder.scheduledTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View style={[
                    styles.reminderStatus,
                    reminder.taken ? styles.takenStatus : styles.notTakenStatus
                  ]}>
                    <Text style={styles.reminderStatusText}>
                      {reminder.taken ? 'Taken' : 'Not Taken'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How This Medication Works</Text>
            <TouchableOpacity
              style={styles.impactButton}
              onPress={() => setShowImpactVisualization(true)}
            >
              <Text style={styles.impactButtonText}>
                View Impact on Body
              </Text>
            </TouchableOpacity>
            
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Instructions</Text>
              <Text style={styles.instructionsText}>
                {selectedSchedule.instructions || 'Take as directed by your healthcare provider.'}
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>
                  {selectedSchedule.type.charAt(0).toUpperCase() + selectedSchedule.type.slice(1)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prescription Required:</Text>
                <Text style={styles.infoValue}>Yes</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Side Effects:</Text>
                <Text style={styles.infoValue}>
                  {getMedicationEffects()
                    .filter(effect => !effect.positiveEffect)
                    .map(effect => effect.description.split(' ')[0])
                    .join(', ')
                  }
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Benefits:</Text>
                <Text style={styles.infoValue}>
                  {getMedicationEffects()
                    .filter(effect => effect.positiveEffect)
                    .map(effect => effect.description.split(' ')[0])
                    .join(', ')
                  }
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => {
                Alert.alert(
                  'Contact Doctor',
                  'Would you like to call your doctor or pharmacist for questions about this medication?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Call Doctor',
                      onPress: () => console.log('Call doctor'),
                    },
                    {
                      text: 'Call Pharmacy',
                      onPress: () => console.log('Call pharmacy'),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.emergencyButtonText}>
                Questions or Side Effects? Contact Your Doctor
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Padding at the bottom for better scrolling */}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 80,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  medicationHeader: {
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  medicationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  medicationDosage: {
    fontSize: 18,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  adherenceLabel: {
    fontSize: 16,
    color: '#666',
  },
  adherenceValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reminderTime: {
    fontSize: 16,
    color: '#333',
  },
  reminderStatus: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  takenStatus: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  notTakenStatus: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  reminderStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  impactButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  impactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    width: 140,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
});

export default MedicationDetailsScreen;