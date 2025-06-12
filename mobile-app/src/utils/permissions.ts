
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

export class PermissionManager {
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la localisation est nécessaire pour trouver les pharmacies près de vous.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async requestBackgroundLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la localisation en arrière-plan est nécessaire pour le suivi des livraisons.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting background location permission:', error);
      return false;
    }
  }

  static async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la caméra est nécessaire pour scanner les ordonnances.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  static async requestNotificationPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Les notifications sont nécessaires pour vous rappeler de prendre vos médicaments.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  static async checkAllPermissions(): Promise<{
    location: boolean;
    camera: boolean;
    notifications: boolean;
  }> {
    const [locationStatus, cameraStatus, notificationStatus] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      Camera.getCameraPermissionsAsync(),
      Notifications.getPermissionsAsync()
    ]);

    return {
      location: locationStatus.status === 'granted',
      camera: cameraStatus.status === 'granted',
      notifications: notificationStatus.status === 'granted'
    };
  }
}
