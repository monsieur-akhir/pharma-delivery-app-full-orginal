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

const PrescriptionScreen = () => {
  const prescriptions = [
    {
      id: 1,
      date: '2024-01-15',
      doctor: 'Dr. Smith',
      status: 'Active',
      medications: ['Amoxicillin 250mg', 'Ibuprofen 400mg'],
    },
    {
      id: 2,
      date: '2024-01-10',
      doctor: 'Dr. Johnson',
      status: 'Completed',
      medications: ['Lisinopril 10mg'],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prescriptions</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <MaterialIcons name="camera-alt" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.uploadCard}>
          <FontAwesome5 name="file-prescription" size={32} color="#0C6B58" />
          <Text style={styles.uploadTitle}>Upload New Prescription</Text>
          <Text style={styles.uploadSubtitle}>Take a photo or select from gallery</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
        
        {prescriptions.map((prescription) => (
          <View key={prescription.id} style={styles.prescriptionCard}>
            <View style={styles.prescriptionHeader}>
              <View style={styles.prescriptionIcon}>
                <FontAwesome5 name="file-medical" size={20} color="#0C6B58" />
              </View>
              <View style={styles.prescriptionInfo}>
                <Text style={styles.prescriptionDate}>
                  {new Date(prescription.date).toLocaleDateString()}
                </Text>
                <Text style={styles.prescriptionDoctor}>{prescription.doctor}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                prescription.status === 'Active' ? styles.statusActive : styles.statusCompleted
              ]}>
                <Text style={[
                  styles.statusText,
                  prescription.status === 'Active' ? styles.statusActiveText : styles.statusCompletedText
                ]}>
                  {prescription.status}
                </Text>
              </View>
            </View>
            
            <View style={styles.medicationsList}>
              <Text style={styles.medicationsTitle}>Medications:</Text>
              {prescription.medications.map((medication, index) => (
                <Text key={index} style={styles.medicationItem}>
                  • {medication}
                </Text>
              ))}
            </View>
            
            <View style={styles.prescriptionActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="visibility" size={18} color="#0C6B58" />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="download" size={18} color="#0C6B58" />
                <Text style={styles.actionButtonText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="share" size={18} color="#0C6B58" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  uploadButton: {
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
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#e6f7f4',
    borderStyle: 'dashed',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C6B58',
    marginTop: 15,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  prescriptionCard: {
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
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  prescriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  prescriptionDoctor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#e8f5e8',
  },
  statusCompleted: {
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusActiveText: {
    color: '#4CAF50',
  },
  statusCompletedText: {
    color: '#666',
  },
  medicationsList: {
    marginBottom: 15,
  },
  medicationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  medicationItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  prescriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0C6B58',
    marginLeft: 5,
    fontWeight: '500',
  },
});

export default PrescriptionScreen;