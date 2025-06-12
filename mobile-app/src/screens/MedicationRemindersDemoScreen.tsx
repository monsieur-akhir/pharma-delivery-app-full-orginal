import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  ReminderAnimation,
  AnimationType,
  MedicationTakingSteps,
  MedicationScheduleProgress,
  AdherenceCelebration,
  MedicationImpactVisualization,
  BodySystem,
} from '../features/medication-reminders/animations';

/**
 * A demo screen to showcase all medication reminder animations
 */
const MedicationRemindersDemoScreen: React.FC = () => {
  // State for controlling which animation to show
  const [showReminderAnimation, setShowReminderAnimation] = useState(false);
  const [showTakingSteps, setShowTakingSteps] = useState(false);
  const [showAdherenceCelebration, setShowAdherenceCelebration] = useState(false);
  const [showImpactVisualization, setShowImpactVisualization] = useState(false);

  // State for the selected medication type in demos
  const [selectedMedicationType, setSelectedMedicationType] = useState<AnimationType>(AnimationType.PILL);

  // Demo data for medication schedules
  const demoSchedules = [
    {
      id: 1,
      medicationName: 'Lisinopril',
      dosage: '10mg',
      type: AnimationType.PILL,
      doses: [
        {
          id: 1,
          time: '8:00 AM',
          taken: true,
          scheduledTime: new Date(new Date().setHours(8, 0, 0, 0)),
        },
        {
          id: 2,
          time: '8:00 PM',
          taken: false,
          scheduledTime: new Date(new Date().setHours(20, 0, 0, 0)),
        },
      ],
      adherenceRate: 0.85,
      instructions: 'Take with food or water',
      color: '#FF5733',
    },
    {
      id: 2,
      medicationName: 'Albuterol',
      dosage: '2 puffs',
      type: AnimationType.INHALER,
      doses: [
        {
          id: 1,
          time: '7:30 AM',
          taken: true,
          scheduledTime: new Date(new Date().setHours(7, 30, 0, 0)),
        },
        {
          id: 2,
          time: '12:30 PM',
          taken: true,
          scheduledTime: new Date(new Date().setHours(12, 30, 0, 0)),
        },
        {
          id: 3,
          time: '5:30 PM',
          taken: false,
          scheduledTime: new Date(new Date().setHours(17, 30, 0, 0)),
        },
        {
          id: 4,
          time: '10:30 PM',
          taken: false,
          scheduledTime: new Date(new Date().setHours(22, 30, 0, 0)),
        },
      ],
      adherenceRate: 0.65,
      instructions: 'Shake well before using. Breathe out fully before inhaling.',
      color: '#D94CFF',
    },
  ];

  // Demo data for medication impact visualization
  const demoMedicationEffects = [
    {
      description: 'Reduces blood pressure by relaxing blood vessels',
      bodySystem: BodySystem.CARDIOVASCULAR,
      timeframe: '2-4 weeks',
      positiveEffect: true,
    },
    {
      description: 'May improve heart function in patients with heart failure',
      bodySystem: BodySystem.CARDIOVASCULAR,
      timeframe: '4-12 weeks',
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
      description: 'Protects kidneys from damage in diabetes patients',
      bodySystem: BodySystem.DIGESTIVE,
      timeframe: 'Long-term effect over months to years',
      positiveEffect: true,
    },
  ];

  // Handle medication dose press
  const handlePressDose = (scheduleId: string | number, doseId: string | number) => {
    console.log(`Pressed dose ${doseId} for schedule ${scheduleId}`);
  };

  // Handle medication schedule press
  const handlePressSchedule = (scheduleId: string | number) => {
    console.log(`Pressed schedule ${scheduleId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Medication Reminders Demo</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Type</Text>
          <View style={styles.medicationTypesContainer}>
            {Object.values(AnimationType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedMedicationType === type && styles.selectedTypeButton,
                ]}
                onPress={() => setSelectedMedicationType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedMedicationType === type && styles.selectedTypeButtonText,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Animations</Text>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => setShowReminderAnimation(true)}
          >
            <Text style={styles.demoButtonText}>Show Reminder Animation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => setShowTakingSteps(true)}
          >
            <Text style={styles.demoButtonText}>Show Taking Steps Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => setShowAdherenceCelebration(true)}
          >
            <Text style={styles.demoButtonText}>Show Adherence Celebration</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => setShowImpactVisualization(true)}
          >
            <Text style={styles.demoButtonText}>Show Medication Impact</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Schedule Progress</Text>

          <MedicationScheduleProgress
            schedules={demoSchedules}
            onPressDose={handlePressDose}
            onPressSchedule={handlePressSchedule}
          />
        </View>
      </ScrollView>

      {/* Pop-up Animations */}
      {showReminderAnimation && (
        <ReminderAnimation
          type={selectedMedicationType}
          reminderText="It's time to take your medication"
          onComplete={() => setShowReminderAnimation(false)}
          onDismiss={() => setShowReminderAnimation(false)}
          medicationName="Medication Name"
          dosage="10mg"
          instructions="Take with food. Do not crush or chew the tablet."
          color="#FF5733"
        />
      )}

      {showTakingSteps && (
        <View style={styles.fullScreenContainer}>
          <MedicationTakingSteps
            type={selectedMedicationType}
            onComplete={async () => setShowTakingSteps(false)}
            medicationName="Medication Name"
            dosage="10mg"
            instructions="Special instructions for taking this medication properly."
          />
        </View>
      )}

      {showAdherenceCelebration && (
        <AdherenceCelebration
          streakDays={14}
          adherencePercentage={92}
          onClose={() => setShowAdherenceCelebration(false)}
        />
      )}

      {showImpactVisualization && (
        <View style={styles.fullScreenContainer}>
          <MedicationImpactVisualization
            medicationName="Lisinopril"
            medicationType={AnimationType.PILL}
            effects={demoMedicationEffects}
            adherence={0.85}
            onClose={() => setShowImpactVisualization(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  medicationTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eaeaea',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTypeButton: {
    backgroundColor: '#4CA6FF',
  },
  typeButtonText: {
    color: '#333',
  },
  selectedTypeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  demoButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  demoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
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
});

export default MedicationRemindersDemoScreen;