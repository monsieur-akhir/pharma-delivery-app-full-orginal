import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const MedicationsScreen = () => {
  const medications = [
    {
      id: 1,
      name: 'Amoxicillin',
      dosage: '250mg',
      frequency: '3 times daily',
      remaining: 15,
      nextDose: '2:00 PM',
    },
    {
      id: 2,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      remaining: 28,
      nextDose: '8:00 PM',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {medications.map((medication) => (
          <View key={medication.id} style={styles.medicationCard}>
            <View style={styles.medicationHeader}>
              <View style={styles.medicationIcon}>
                <FontAwesome5 name="pills" size={20} color="#0C6B58" />
              </View>
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>{medication.name}</Text>
                <Text style={styles.medicationDosage}>{medication.dosage}</Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <MaterialIcons name="more-vert" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.medicationDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Frequency:</Text>
                <Text style={styles.detailValue}>{medication.frequency}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remaining:</Text>
                <Text style={styles.detailValue}>{medication.remaining} pills</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next dose:</Text>
                <Text style={styles.detailValue}>{medication.nextDose}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.takeMedicationButton}>
              <Text style={styles.takeMedicationText}>Mark as Taken</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity style={styles.addMedicationCard}>
          <MaterialIcons name="add-circle-outline" size={48} color="#0C6B58" />
          <Text style={styles.addMedicationText}>Add New Medication</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  moreButton: {
    padding: 5,
  },
  medicationDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  takeMedicationButton: {
    backgroundColor: '#0C6B58',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  takeMedicationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addMedicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e6f7f4',
    borderStyle: 'dashed',
  },
  addMedicationText: {
    fontSize: 16,
    color: '#0C6B58',
    marginTop: 10,
    fontWeight: '500',
  },
});

export default MedicationsScreen;