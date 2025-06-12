
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
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

  // Note: MediaLibrary is no longer available in current Expo versions
  // Use expo-image-picker instead for gallery access
  static async requestMediaLibraryPermission(): Promise<PermissionStatus> {
    try {
      // For now, we'll use a placeholder implementation
      // In a real app, you would use expo-image-picker permissions
      console.warn('MediaLibrary permission not available - use expo-image-picker instead');
      return {
        granted: false,
        status: 'unavailable',
      };
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return {
        granted: false,
        status: 'error',
      };
    }
  }

  static async checkPermission(type: 'location' | 'notification' | 'camera' | 'mediaLibrary'): Promise<PermissionStatus> {
    try {
      switch (type) {
        case 'location':
          const locationStatus = await Location.getForegroundPermissionsAsync();
          return {
            granted: locationStatus.status === 'granted',
            status: locationStatus.status,
            canAskAgain: locationStatus.canAskAgain,
          };

        case 'notification':
          const notificationStatus = await Notifications.getPermissionsAsync();
          return {
            granted: notificationStatus.status === 'granted',
            status: notificationStatus.status,
            canAskAgain: notificationStatus.canAskAgain,
          };

        case 'camera':
          const cameraStatus = await Camera.getCameraPermissionsAsync();
          return {
            granted: cameraStatus.status === 'granted',
            status: cameraStatus.status,
            canAskAgain: cameraStatus.canAskAgain,
          };

        case 'mediaLibrary':
          // MediaLibrary not available - return placeholder
          return {
            granted: false,
            status: 'unavailable',
            canAskAgain: false,
          };

        default:
          return {
            granted: false,
            status: 'unknown',
          };
      }
    } catch (error) {
      console.error(`Error checking ${type} permission:`, error);
      return {
        granted: false,
        status: 'error',
      };
    }
  }

  static async requestAllPermissions(): Promise<{ [key: string]: PermissionStatus }> {
    const results: { [key: string]: PermissionStatus } = {};

    try {
      results.location = await this.requestLocationPermission();
      results.notification = await this.requestNotificationPermission();
      results.camera = await this.requestCameraPermission();
      // Skip mediaLibrary as it's not available

      return results;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return results;
    }
  }

  static showPermissionAlert(type: string, onRetry?: () => void): void {
    Alert.alert(
      'Permission Required',
      `This app needs ${type} permission to function properly. Please enable it in your device settings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Retry',
          onPress: onRetry,
        },
      ]
    );
  }
}

export default PermissionManager;
