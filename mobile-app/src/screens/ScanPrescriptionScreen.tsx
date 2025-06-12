
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { api } from '../services/api';

interface AnalysisResult {
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  doctorName?: string;
  prescriptionDate?: string;
  confidence: number;
  warnings?: string[];
}

const ScanPrescriptionScreen: React.FC = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to scan prescriptions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => requestPermission() },
          ]
        );
      }
    }
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImage(photo.uri);
        analyzePrescription(photo.base64!, photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        analyzePrescription(result.assets[0].base64!, result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const analyzePrescription = async (base64Image: string, imageUri: string) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'prescription.jpg',
      } as any);

      const response = await api.post('/api/prescriptions/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysisResult(response.data);
    } catch (error) {
      console.error('Error analyzing prescription:', error);
      Alert.alert(
        'Analysis Failed',
        'Failed to analyze prescription. Please ensure the image is clear and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  const savePrescription = async () => {
    if (!analysisResult) return;

    try {
      const response = await api.post('/api/prescriptions/save', {
        imageUri: capturedImage,
        analysisResult,
      });

      Alert.alert(
        'Success',
        'Prescription saved successfully!',
        [
          {
            text: 'View Prescription',
            onPress: () => navigation.navigate('PrescriptionDetail', {
              prescriptionId: response.data.id,
            }),
          },
          {
            text: 'Order Medicines',
            onPress: () => navigation.navigate('MedicineSearch', {
              medicines: analysisResult.medicines,
            }),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving prescription:', error);
      Alert.alert('Error', 'Failed to save prescription');
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    return (
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>
          <Text style={styles.analysisTitle}>Analysis Result</Text>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <Text style={[
              styles.confidenceValue,
              analysisResult.confidence > 0.8 ? styles.highConfidence :
              analysisResult.confidence > 0.6 ? styles.mediumConfidence :
              styles.lowConfidence
            ]}>
              {Math.round(analysisResult.confidence * 100)}%
            </Text>
          </View>
        </View>

        {analysisResult.doctorName && (
          <View style={styles.prescriptionInfo}>
            <Text style={styles.infoLabel}>Doctor:</Text>
            <Text style={styles.infoValue}>{analysisResult.doctorName}</Text>
          </View>
        )}

        {analysisResult.prescriptionDate && (
          <View style={styles.prescriptionInfo}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(analysisResult.prescriptionDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        <Text style={styles.medicinesTitle}>Prescribed Medicines:</Text>
        {analysisResult.medicines.map((medicine, index) => (
          <View key={index} style={styles.medicineCard}>
            <Text style={styles.medicineName}>{medicine.name}</Text>
            <Text style={styles.medicineDosage}>Dosage: {medicine.dosage}</Text>
            <Text style={styles.medicineFrequency}>Frequency: {medicine.frequency}</Text>
            <Text style={styles.medicineDuration}>Duration: {medicine.duration}</Text>
            {medicine.instructions && (
              <Text style={styles.medicineInstructions}>
                Instructions: {medicine.instructions}
              </Text>
            )}
          </View>
        ))}

        {analysisResult.warnings && analysisResult.warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            <Text style={styles.warningsTitle}>⚠️ Warnings:</Text>
            {analysisResult.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={savePrescription}>
            <Text style={styles.saveButtonText}>Save Prescription</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <MaterialIcons name="camera-alt" size={64} color="#ccc" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan your prescriptions
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription Analysis</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="#0C6B58" />
              <Text style={styles.analyzingText}>Analyzing prescription...</Text>
            </View>
          )}
        </View>

        {renderAnalysisResult()}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        ref={(ref) => setCameraRef(ref)}
      >
        <SafeAreaView style={styles.cameraOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Scan Prescription</Text>
            <TouchableOpacity onPress={pickFromGallery}>
              <MaterialIcons name="photo-library" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanFrame}>
            <View style={styles.scanCorner} />
            <View style={[styles.scanCorner, styles.topRight]} />
            <View style={[styles.scanCorner, styles.bottomLeft]} />
            <View style={[styles.scanCorner, styles.bottomRight]} />
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Position the prescription within the frame
            </Text>
            <Text style={styles.instructionsSubtext}>
              Ensure good lighting and the text is clearly visible
            </Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner}>
                <MaterialIcons name="camera-alt" size={24} color="#0C6B58" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#0C6B58',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  galleryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0C6B58',
  },
  galleryButtonText: {
    color: '#0C6B58',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: 300,
    borderColor: '#0C6B58',
    borderWidth: 2,
    borderRadius: 12,
  },
  scanCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#0C6B58',
    borderWidth: 4,
    top: -2,
    left: -2,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  topRight: {
    top: -2,
    right: -2,
    left: 'auto',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  bottomLeft: {
    bottom: -2,
    top: 'auto',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    top: 'auto',
    left: 'auto',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  instructionsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0C6B58',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  analysisContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  confidenceValue: {
    fontSize: 16,
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
  prescriptionInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  medicinesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C6B58',
    marginBottom: 4,
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
    marginBottom: 2,
  },
  medicineInstructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  warningsContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#0C6B58',
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#0C6B58',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0C6B58',
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanPrescriptionScreen;
