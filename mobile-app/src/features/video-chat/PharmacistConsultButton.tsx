import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL } from '../../config/constants';

interface PharmacistConsultButtonProps {
  pharmacistId?: number;
  orderId?: number;
  label?: string;
  style?: any;
}

const PharmacistConsultButton: React.FC<PharmacistConsultButtonProps> = ({
  pharmacistId,
  orderId,
  label = 'Consulter un pharmacien',
  style,
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [pharmacistsAvailable, setPharmacistsAvailable] = useState(false);
  
  // Check if pharmacists are available
  useEffect(() => {
    const checkPharmacistAvailability = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/video-chat/pharmacists/available`);
        if (response.ok) {
          const data = await response.json();
          setPharmacistsAvailable(data.availableCount > 0);
        }
      } catch (error) {
        console.error('Failed to check pharmacist availability:', error);
        // Default to true to allow users to try anyway
        setPharmacistsAvailable(true);
      }
    };
    
    checkPharmacistAvailability();
    
    // Set up periodic check every 30 seconds
    const intervalId = setInterval(checkPharmacistAvailability, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handlePress = async () => {
    setLoading(true);
    
    try {
      // Check if there's an ongoing consultation
      const ongoingCheckResponse = await fetch(`${API_BASE_URL}/api/video-chat/ongoing-consultation`);
      const ongoingCheckData = await ongoingCheckResponse.json();
      
      if (ongoingCheckData.hasOngoing) {
        Alert.alert(
          'Consultation en cours',
          'Vous avez déjà une consultation en cours. Voulez-vous la rejoindre ?',
          [
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => setLoading(false),
            },
            {
              text: 'Rejoindre',
              onPress: () => {
                setLoading(false);
                navigation.navigate('VideoChat', {
                  roomId: ongoingCheckData.roomId,
                });
              },
            },
          ]
        );
        return;
      }
      
      if (!pharmacistsAvailable) {
        Alert.alert(
          'Aucun pharmacien disponible',
          'Aucun pharmacien n\'est disponible pour une consultation en ce moment. Veuillez réessayer plus tard.',
          [
            {
              text: 'OK',
              onPress: () => setLoading(false),
            },
          ]
        );
        return;
      }
      
      // Navigate to the video chat screen
      setLoading(false);
      navigation.navigate('VideoChat', {
        pharmacistId,
        orderId,
      });
    } catch (error) {
      console.error('Failed to start consultation:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la tentative de démarrage de la consultation. Veuillez réessayer.',
        [
          {
            text: 'OK',
            onPress: () => setLoading(false),
          },
        ]
      );
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons name="videocam" size={20} color="#FFF" style={styles.icon} />
          <Text style={styles.buttonText}>{label}</Text>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: pharmacistsAvailable ? '#4CD964' : '#FF3B30' },
              ]}
            />
            <Text style={styles.statusText}>
              {pharmacistsAvailable ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
  },
});

export default PharmacistConsultButton;