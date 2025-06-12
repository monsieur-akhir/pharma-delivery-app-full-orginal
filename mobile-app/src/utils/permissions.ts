
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
// MediaLibrary import removed as it's not available in current Expo version
import { Alert, Platform } from 'react-native';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain?: boolean;
  status: string;
}

export class PermissionManager {
  static async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return {
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        status: 'error',
      };
    }
  }

  static async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return {
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return {
        granted: false,
        status: 'error',
      };
    }
  }

  static async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return {
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return {
        granted: false,
        status: 'error',
      };
    }
  }

  static async requestMediaLibraryPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return {
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return {
        granted: false,
        status: 'error',
      };
    }
  }

  static async checkAllPermissions(): Promise<{
    location: PermissionStatus;
    notifications: PermissionStatus;
    camera: PermissionStatus;
  }> {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const notificationStatus = await Notifications.getPermissionsAsync();
      const cameraStatus = await Camera.getCameraPermissionsAsync();

      return {
        location: {
          granted: locationStatus.granted,
          status: locationStatus.status,
        },
        notifications: {
          granted: notificationStatus.granted,
          status: notificationStatus.status,
        },
        camera: {
          granted: cameraStatus.granted,
          status: cameraStatus.status,
        },
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      throw error;
    }
  }

  static showPermissionAlert(permissionType: string, onSettings?: () => void) {
    Alert.alert(
      `Permission ${permissionType} requise`,
      `Cette application nécessite l'accès ${permissionType} pour fonctionner correctement.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Paramètres',
          onPress: onSettings,
        },
      ]
    );
  }
}
