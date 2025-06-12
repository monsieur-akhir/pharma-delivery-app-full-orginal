
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { api } from '../services/api';

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  price: number;
  inStock: boolean;
}

interface Prescription {
  id: number;
  imageUrl: string;
  doctorName: string;
  prescriptionDate: string;
  status: 'pending' | 'analyzed' | 'fulfilled' | 'expired';
  medicines: Medicine[];
  analysisResult?: {
    confidence: number;
    warnings?: string[];
  };
  notes?: string;
  totalCost: number;
}

const PrescriptionDetailScreen: React.FC = ({ route, navigation }: any) => {
  const { prescriptionId } = route.params;
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPrescriptionDetails();
  }, [prescriptionId]);

  const loadPrescriptionDetails = async () => {
    try {
      const response = await api.get(`/api/prescriptions/${prescriptionId}`);
      setPrescription(response.data);
    } catch (error) {
      console.error('Error loading prescription details:', error);
      Alert.alert('Error', 'Failed to load prescription details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderMedicines = () => {
    if (!prescription) return;

    const availableMedicines = prescription.medicines.filter(m => m.inStock);
    
    if (availableMedicines.length === 0) {
      Alert.alert('No Available Medicines', 'None of the prescribed medicines are currently in stock.');
      return;
    }

    navigation.navigate('Cart', {
      medicines: availableMedicines,
      prescriptionId: prescription.id,
    });
  };

  const handleSharePrescription = () => {
    Alert.alert('Share Prescription', 'Prescription sharing functionality will be implemented soon.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFC107';
      case 'analyzed': return '#2196F3';
      case 'fulfilled': return '#4CAF50';
      case 'expired': return '#F44336';
      default: return '#666';
    }
  };

  const renderMedicine = (medicine: Medicine, index: number) => (
    <View key={medicine.id} style={styles.medicineCard}>
      <View style={styles.medicineHeader}>
        <Text style={styles.medicineName}>{medicine.name}</Text>
        <View style={[
          styles.stockBadge,
          { backgroundColor: medicine.inStock ? '#E8F5E8' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.stockText,
            { color: medicine.inStock ? '#4CAF50' : '#F44336' }
          ]}>
            {medicine.inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.medicineDosage}>Dosage: {medicine.dosage}</Text>
      <Text style={styles.medicineFrequency}>Frequency: {medicine.frequency}</Text>
      <Text style={styles.medicineDuration}>Duration: {medicine.duration}</Text>
      
      {medicine.instructions && (
        <Text style={styles.medicineInstructions}>
          Instructions: {medicine.instructions}
        </Text>
      )}
      
      <View style={styles.medicineFooter}>
        <Text style={styles.medicinePrice}>${medicine.price.toFixed(2)}</Text>
        {medicine.inStock && (
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => navigation.navigate('MedicineSearch', {
              selectedMedicine: medicine,
            })}
          >
            <MaterialIcons name="add-shopping-cart" size={16} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Loading prescription...</Text>
      </SafeAreaView>
    );
  }

  if (!prescription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Prescription not found</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription Details</Text>
        <TouchableOpacity onPress={handleSharePrescription}>
          <MaterialIcons name="share" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Prescription Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: prescription.imageUrl }} style={styles.prescriptionImage} />
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(prescription.status) }
          ]}>
            <Text style={styles.statusText}>{prescription.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Doctor and Date Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#0C6B58" />
            <Text style={styles.infoLabel}>Doctor:</Text>
            <Text style={styles.infoValue}>{prescription.doctorName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="date-range" size={20} color="#0C6B58" />
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(prescription.prescriptionDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Analysis Result */}
        {prescription.analysisResult && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Analysis Result</Text>
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>Confidence Level:</Text>
              <Text style={[
                styles.confidenceValue,
                prescription.analysisResult.confidence > 0.8 ? styles.highConfidence :
                prescription.analysisResult.confidence > 0.6 ? styles.mediumConfidence :
                styles.lowConfidence
              ]}>
                {Math.round(prescription.analysisResult.confidence * 100)}%
              </Text>
            </View>
            
            {prescription.analysisResult.warnings && prescription.analysisResult.warnings.length > 0 && (
              <View style={styles.warningsContainer}>
                <Text style={styles.warningsTitle}>⚠️ Warnings:</Text>
                {prescription.analysisResult.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>• {warning}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Medicines List */}
        <View style={styles.medicinesSection}>
          <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
          {prescription.medicines.map((medicine, index) => renderMedicine(medicine, index))}
        </View>

        {/* Total Cost */}
        <View style={styles.totalCostCard}>
          <Text style={styles.totalCostLabel}>Total Estimated Cost:</Text>
          <Text style={styles.totalCostValue}>${prescription.totalCost.toFixed(2)}</Text>
        </View>

        {/* Notes */}
        {prescription.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{prescription.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={handleOrderMedicines}
          >
            <MaterialIcons name="shopping-cart" size={20} color="#fff" />
            <Text style={styles.orderButtonText}>Order Medicines</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.consultButton}
            onPress={() => navigation.navigate('VideoConsultation')}
          >
            <MaterialIcons name="video-call" size={20} color="#0C6B58" />
            <Text style={styles.consultButtonText}>Consult Pharmacist</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#666',
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  highConfidence: {
    color: '#4CAF50',
  },
  mediumConfidence: {
    color: '#FF9800',
  },
  lowConfidence: {
    color: '#F44336',
  },
  warningsContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  medicinesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C6B58',
    flex: 1,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  medicineDosage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  medicineFrequency: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  medicineDuration: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  medicineInstructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  medicineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicinePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C6B58',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  totalCostCard: {
    backgroundColor: '#0C6B58',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCostLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  totalCostValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    marginBottom: 20,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C6B58',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  consultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#0C6B58',
  },
  consultButtonText: {
    color: '#0C6B58',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: '#0C6B58',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrescriptionDetailScreen;
