import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

class NotificationService {
  private deviceToken: string | null = null;
  private devicePlatform: string;
  
  constructor() {
    this.devicePlatform = Platform.OS;
    this.init();
  }
  
  /**
   * Initialize the notification service
   */
  async init(): Promise<void> {
    // Load saved token from storage if exists
    try {
      this.deviceToken = await AsyncStorage.getItem('@device_token');
    } catch (error) {
      console.error('Error loading device token from storage', error);
    }
  }
  
  /**
   * Register the device token for push notifications
   * @param token - Device token for push notifications
   */
  async registerDeviceToken(token: string): Promise<void> {
    this.deviceToken = token;
    
    try {
      // Save token to storage
      await AsyncStorage.setItem('@device_token', token);
      
      // Register with backend
      await axios.post(`${API_URL}/notifications/register-device`, {
        token,
        platform: this.devicePlatform
      });
      
      console.log('Device registered for notifications successfully');
    } catch (error) {
      console.error('Error registering device for notifications', error);
    }
  }
  
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    // Implementation for request permissions would depend on the specific
    // notification library being used (e.g., expo-notifications, react-native-push-notification)
    try {
      // This is a placeholder - would be replaced with actual permission request code
      console.log('Requesting notification permissions');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions', error);
      return false;
    }
  }
  
  /**
   * Toggle notification settings for specific types of notifications
   * @param notificationType - Type of notification
   * @param enabled - Whether to enable or disable
   */
  async toggleNotificationSetting(notificationType: string, enabled: boolean): Promise<void> {
    try {
      await axios.post(`${API_URL}/notifications/preferences`, {
        type: notificationType,
        enabled,
        deviceToken: this.deviceToken
      });
      
      console.log(`Notification preference updated: ${notificationType} - ${enabled}`);
    } catch (error) {
      console.error('Error updating notification preferences', error);
    }
  }
  
  /**
   * Get current notification preferences
   */
  async getNotificationPreferences(): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/notifications/preferences`, {
        params: { deviceToken: this.deviceToken }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences', error);
      return null;
    }
  }
  
  /**
   * Schedule a local medication reminder notification
   * @param reminderInfo - Reminder information
   */
  async scheduleMedicationReminder(reminderInfo: {
    id: string;
    medicineName: string;
    dosage: string;
    time: Date;
    recurring: boolean;
    daysOfWeek?: number[];
  }): Promise<boolean> {
    try {
      // This would be replaced with actual local notification scheduling code
      // depending on the notification library being used
      console.log('Scheduling medication reminder', reminderInfo);
      
      // Also sync with backend
      await axios.post(`${API_URL}/reminders`, {
        ...reminderInfo,
        deviceToken: this.deviceToken
      });
      
      return true;
    } catch (error) {
      console.error('Error scheduling medication reminder', error);
      return false;
    }
  }
  
  /**
   * Cancel a medication reminder
   * @param reminderId - ID of the reminder to cancel
   */
  async cancelMedicationReminder(reminderId: string): Promise<boolean> {
    try {
      // Cancel local notification
      // This would be replaced with actual code for canceling a notification
      console.log('Canceling medication reminder', reminderId);
      
      // Sync with backend
      await axios.delete(`${API_URL}/reminders/${reminderId}`);
      
      return true;
    } catch (error) {
      console.error('Error canceling medication reminder', error);
      return false;
    }
  }
  
  /**
   * Handle received notification (when app is in foreground)
   * @param notification - Notification data
   */
  handleReceivedNotification(notification: any): void {
    // Process and display the notification when app is in foreground
    console.log('Received notification in foreground', notification);
    
    // Here you would typically:
    // 1. Parse notification data
    // 2. Update app state if needed
    // 3. Display in-app notification if appropriate
    // 4. Trigger any relevant actions based on notification type
  }
  
  /**
   * Handle notification click/open
   * @param notification - Notification data
   */
  handleNotificationOpen(notification: any): void {
    // Handle user clicking on the notification
    console.log('User opened notification', notification);
    
    // Here you would typically:
    // 1. Parse notification data
    // 2. Navigate to relevant screen based on notification type
    // 3. Perform any actions needed based on notification content
  }
  
  /**
   * Get badge count for app icon
   */
  async getBadgeCount(): Promise<number> {
    try {
      const response = await axios.get(`${API_URL}/notifications/badge-count`, {
        params: { deviceToken: this.deviceToken }
      });
      
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching badge count', error);
      return 0;
    }
  }
  
  /**
   * Reset badge count to zero
   */
  async resetBadgeCount(): Promise<void> {
    try {
      await axios.post(`${API_URL}/notifications/reset-badge`, {
        deviceToken: this.deviceToken
      });
      
      // Would call platform-specific code to reset badge here
    } catch (error) {
      console.error('Error resetting badge count', error);
    }
  }
}

export default new NotificationService();