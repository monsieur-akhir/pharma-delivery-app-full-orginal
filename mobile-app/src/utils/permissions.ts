
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
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
      const [permission, requestPermission] = Camera.useCameraPermissions();
      
      if (!permission) {
        const result = await requestPermission();
        return {
          granted: result.granted,
          status: result.status,
        };
      }
      
      if (!permission.granted) {
        const result = await requestPermission();
        return {
          granted: result.granted,
          status: result.status,
        };
      }

      return {
        granted: permission.granted,
        status: permission.status,
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
    mediaLibrary: PermissionStatus;
  }> {
    try {
      const [locationStatus] = await Location.getForegroundPermissionsAsync();
      const notificationStatus = await Notifications.getPermissionsAsync();
      const [cameraPermission] = Camera.useCameraPermissions();
      const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();

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
          granted: cameraPermission?.granted || false,
          status: cameraPermission?.status || 'undetermined',
        },
        mediaLibrary: {
          granted: mediaLibraryStatus.granted,
          status: mediaLibraryStatus.status,
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
