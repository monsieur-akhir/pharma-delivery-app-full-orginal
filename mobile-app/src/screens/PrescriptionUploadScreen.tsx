import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '@/navigation/AppNavigator';
import { uploadPrescription, setPreviewImage, clearPrescriptionData } from '@/store/slices/prescriptionSlice';
import { AppDispatch, RootState } from '@/store';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import PrescriptionPreview from '@/components/PrescriptionPreview';

type PrescriptionUploadScreenNavigationProp = StackNavigationProp<MainStackParamList, 'PrescriptionUpload'>;
type PrescriptionUploadScreenRouteProp = RouteProp<MainStackParamList, 'PrescriptionUpload'>;

interface Props {
  navigation: PrescriptionUploadScreenNavigationProp;
  route: PrescriptionUploadScreenRouteProp;
}

const PrescriptionUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [camera, setCamera] = useState<CameraView | null>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const { previewImage, isLoading, error, currentPrescription } = useSelector((state: RootState) => state.prescription);
  
  // Get orderId from route params
  const orderId = route.params?.orderId;

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearPrescriptionData());
    };
  }, []);

  const takePicture = async () => {
    if (camera) {
      try {
        const photo = await camera.takePictureAsync({
          quality: 0.8,
        });
        
        dispatch(setPreviewImage(photo.uri));
        setCameraVisible(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        dispatch(setPreviewImage(result.assets[0].uri));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!previewImage) {
      Alert.alert('Error', 'Please take or select a prescription image first.');
      return;
    }
    
    try {
      await dispatch(uploadPrescription({ uri: previewImage, orderId })).unwrap();
      Alert.alert(
        'Success',
        'Your prescription has been uploaded successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to payment or order tracking
              if (orderId) {
                navigation.navigate('Payment', { orderId });
              } else {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', error || 'Failed to upload prescription. Please try again.');
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A80F0" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Request Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.permissionButton, { marginTop: 10 }]}
          onPress={pickImage}
        >
          <Text style={styles.permissionButtonText}>Select from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          ref={(ref) => setCamera(ref)}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={() => setCameraVisible(false)}
            >
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shutterButton}
              onPress={takePicture}
            >
              <View style={styles.shutterButtonInner} />
            </TouchableOpacity>
            
            <View style={{ width: 48 }} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Upload Prescription</Text>
        <Text style={styles.subtitle}>
          Take a photo of your prescription or upload from your gallery
        </Text>
        
        {previewImage ? (
          <PrescriptionPreview 
            imageUri={previewImage} 
            onRemove={() => dispatch(setPreviewImage(null))}
          />
        ) : (
          <View style={styles.uploadContainer}>
            <Feather name="file-text" size={60} color="#CBD5E1" />
            <Text style={styles.uploadText}>No prescription selected</Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => setCameraVisible(true)}
              >
                <Feather name="camera" size={20} color="#fff" style={styles.uploadButtonIcon} />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.uploadButton, styles.secondaryButton]}
                onPress={pickImage}
              >
                <Feather name="image" size={20} color="#4A80F0" style={styles.uploadButtonIcon} />
                <Text style={[styles.uploadButtonText, styles.secondaryButtonText]}>
                  From Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={20} color="#10B981" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>
              Make sure the prescription is clear and legible
            </Text>
          </View>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={20} color="#10B981" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>
              Ensure all details including medicines and dosage are visible
            </Text>
          </View>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={20} color="#10B981" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>
              Your prescription will be reviewed by a pharmacist before processing
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!previewImage || isLoading) && styles.disabledButton
          ]}
          onPress={handleUpload}
          disabled={!previewImage || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Prescription</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  uploadContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A80F0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#4A80F0',
  },
  uploadButtonIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4A80F0',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  instruction: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionIcon: {
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  submitButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrescriptionUploadScreen;
