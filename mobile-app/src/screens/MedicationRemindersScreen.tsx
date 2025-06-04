import React from 'react';
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import { MedicationDashboard } from '../features/medication-reminders';

/**
 * Main screen for displaying medication reminders and adherence dashboard
 */
const MedicationRemindersScreen: React.FC = ({ navigation }: any) => {
  // Mock user ID - in a real app, this would come from authentication
  const userId = 1;
  
  // Navigate to medication details
  const navigateToDetails = (scheduleId: string | number) => {
    navigation.navigate('MedicationDetails', { scheduleId });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medication Reminders</Text>
      </View>
      
      <MedicationDashboard 
        userId={userId}
        navigateToDetails={navigateToDetails}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0055AA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});

export default MedicationRemindersScreen;