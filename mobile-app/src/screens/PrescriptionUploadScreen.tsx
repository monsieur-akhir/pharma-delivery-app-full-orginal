import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '@/navigation/AppNavigator';
import {
  uploadPrescription,
  setPreviewImage,
  clearPrescriptionData,
} from '@/store/slices/prescriptionSlice';
import { AppDispatch, RootState } from '@/store';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import PrescriptionPreview from '../components/PrescriptionPreview';

type Props = StackScreenProps<MainStackParamList, 'PrescriptionUpload'>;

const PrescriptionUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<Camera>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { previewImage, isLoading, error } = useSelector(
    (state: RootState) => state.prescription
  );

  const { orderId } = route.params;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    return () => {
      dispatch(clearPrescriptionData());
    };
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        dispatch(setPreviewImage(photo.uri));
        setCameraVisible(false);
      } catch (error) {
        console.error('Erreur lors de la prise de photo:', error);
        Alert.alert('Erreur', 'Échec de la prise de photo. Veuillez réessayer.');
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
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Échec de la sélection d\'image. Veuillez réessayer.');
    }
  };

  const handleUpload = async () => {
    if (!previewImage) {
      Alert.alert('Erreur', 'Veuillez prendre ou sélectionner une image d\'ordonnance d\'abord.');
      return;
    }

    try {
      await dispatch(uploadPrescription({ uri: previewImage, orderId })).unwrap();
      Alert.alert('Succès', 'Votre ordonnance a été téléchargée avec succès.', [
        {
          text: 'OK',
          onPress: () => {
            if (orderId) {
              navigation.navigate('Payment', { orderId });
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Erreur', error || 'Échec du téléchargement de l\'ordonnance. Veuillez réessayer.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A80F0" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Pas d'accès à la caméra</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={pickImage}>
          <Text style={styles.permissionButtonText}>Sélectionner depuis la galerie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.back}
          ref={cameraRef}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraButton} onPress={() => setCameraVisible(false)}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
              <View style={styles.shutterButtonInner} />
            </TouchableOpacity>

            <View style={{ width: 48 }} />
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Télécharger une ordonnance</Text>
        <Text style={styles.subtitle}>Prenez une photo de votre ordonnance ou téléchargez depuis votre galerie</Text>

        {previewImage ? (
          <PrescriptionPreview
            imageUri={previewImage}
            onRemove={() => dispatch(setPreviewImage(null))}
          />
        ) : (
          <View style={styles.uploadContainer}>
            <Feather name="file-text" size={60} color="#CBD5E1" />
            <Text style={styles.uploadText}>Aucune ordonnance sélectionnée</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.uploadButton} onPress={() => setCameraVisible(true)}>
                <Feather name="camera" size={20} color="#fff" style={styles.uploadButtonIcon} />
                <Text style={styles.uploadButtonText}>Prendre une photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, styles.secondaryButton]}
                onPress={pickImage}
              >
                <Feather name="image" size={20} color="#4A80F0" style={styles.uploadButtonIcon} />
                <Text style={[styles.uploadButtonText, styles.secondaryButtonText]}>Depuis la galerie</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={20} color="#10B981" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>Assurez-vous que l'ordonnance est claire et lisible</Text>
          </View>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={20} color="#10B981" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>Vérifiez que tous les détails (médicaments et posologie) sont visibles</Text>
          </View>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={20} color="#10B981" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>Votre ordonnance sera vérifiée par un pharmacien avant traitement</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, (!previewImage || isLoading) && styles.disabledButton]}
          onPress={handleUpload}
          disabled={!previewImage || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Télécharger l'ordonnance</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 24 },
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
  uploadText: { fontSize: 16, color: '#64748B', marginTop: 16, marginBottom: 24 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center' },
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
  uploadButtonIcon: { marginRight: 8 },
  uploadButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryButtonText: { color: '#4A80F0' },
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
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
  disabledButton: { backgroundColor: '#94A3B8' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
});

export default PrescriptionUploadScreen;