
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { api } from '../services/api';

interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    reminders: boolean;
  };
  privacy: {
    shareLocation: boolean;
    shareHealthData: boolean;
    analytics: boolean;
  };
  preferences: {
    language: string;
    currency: string;
    theme: string;
  };
}

const SettingsScreen: React.FC = ({ navigation }: any) => {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      push: true,
      email: true,
      sms: false,
      orderUpdates: true,
      promotions: false,
      reminders: true,
    },
    privacy: {
      shareLocation: true,
      shareHealthData: false,
      analytics: true,
    },
    preferences: {
      language: 'English',
      currency: 'USD',
      theme: 'System',
    },
  });
  
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await api.get('/api/users/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSettings = async (newSettings: UserSettings) => {
    try {
      setIsSaving(true);
      await api.put('/api/users/settings', newSettings);
      setSettings(newSettings);
      Alert.alert('Success', 'Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationToggle = (key: keyof UserSettings['notifications'], value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    };
    updateSettings(newSettings);
  };

  const handlePrivacyToggle = (key: keyof UserSettings['privacy'], value: boolean) => {
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    };
    updateSettings(newSettings);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await api.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      Alert.alert('Success', 'Password changed successfully');
      setIsPasswordModalVisible(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/api/users/account');
              dispatch(logout());
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    icon: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <MaterialIcons name={icon} size={24} color="#0C6B58" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={value ? '#0C6B58' : '#f4f3f4'}
      />
    </View>
  );

  const renderActionItem = (
    title: string,
    subtitle: string,
    onPress: () => void,
    icon: string,
    isDestructive = false
  ) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <MaterialIcons name={icon} size={24} color={isDestructive ? '#F44336' : '#0C6B58'} />
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          
          {renderActionItem(
            'Edit Profile',
            'Update your personal information',
            () => navigation.navigate('EditProfile'),
            'person'
          )}
          
          {renderActionItem(
            'Change Password',
            'Update your account password',
            () => setIsPasswordModalVisible(true),
            'lock'
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderSettingItem(
            'Push Notifications',
            'Receive push notifications on your device',
            settings.notifications.push,
            (value) => handleNotificationToggle('push', value),
            'notifications'
          )}
          
          {renderSettingItem(
            'Email Notifications',
            'Receive email updates and alerts',
            settings.notifications.email,
            (value) => handleNotificationToggle('email', value),
            'email'
          )}
          
          {renderSettingItem(
            'SMS Notifications',
            'Receive SMS updates for important alerts',
            settings.notifications.sms,
            (value) => handleNotificationToggle('sms', value),
            'sms'
          )}
          
          {renderSettingItem(
            'Order Updates',
            'Get notified about order status changes',
            settings.notifications.orderUpdates,
            (value) => handleNotificationToggle('orderUpdates', value),
            'local-shipping'
          )}
          
          {renderSettingItem(
            'Medication Reminders',
            'Receive reminders to take your medications',
            settings.notifications.reminders,
            (value) => handleNotificationToggle('reminders', value),
            'alarm'
          )}
          
          {renderSettingItem(
            'Promotions',
            'Receive promotional offers and discounts',
            settings.notifications.promotions,
            (value) => handleNotificationToggle('promotions', value),
            'local-offer'
          )}
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          {renderSettingItem(
            'Share Location',
            'Allow location sharing for delivery tracking',
            settings.privacy.shareLocation,
            (value) => handlePrivacyToggle('shareLocation', value),
            'location-on'
          )}
          
          {renderSettingItem(
            'Share Health Data',
            'Share health data for better recommendations',
            settings.privacy.shareHealthData,
            (value) => handlePrivacyToggle('shareHealthData', value),
            'health-and-safety'
          )}
          
          {renderSettingItem(
            'Analytics',
            'Help improve our app with usage analytics',
            settings.privacy.analytics,
            (value) => handlePrivacyToggle('analytics', value),
            'analytics'
          )}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          {renderActionItem(
            'Help Center',
            'Get help and find answers to common questions',
            () => navigation.navigate('HelpCenter'),
            'help'
          )}
          
          {renderActionItem(
            'Contact Support',
            'Get in touch with our support team',
            () => navigation.navigate('ContactSupport'),
            'support'
          )}
          
          {renderActionItem(
            'Terms of Service',
            'Read our terms and conditions',
            () => navigation.navigate('TermsOfService'),
            'description'
          )}
          
          {renderActionItem(
            'Privacy Policy',
            'Learn about how we protect your data',
            () => navigation.navigate('PrivacyPolicy'),
            'privacy-tip'
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {renderActionItem(
            'Logout',
            'Sign out of your account',
            handleLogout,
            'logout'
          )}
          
          {renderActionItem(
            'Delete Account',
            'Permanently delete your account and data',
            handleDeleteAccount,
            'delete-forever',
            true
          )}
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={isPasswordModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsPasswordModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({
                  ...passwordData,
                  currentPassword: text,
                })}
                secureTextEntry
                placeholder="Enter current password"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({
                  ...passwordData,
                  newPassword: text,
                })}
                secureTextEntry
                placeholder="Enter new password"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({
                  ...passwordData,
                  confirmPassword: text,
                })}
                secureTextEntry
                placeholder="Confirm new password"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  destructiveText: {
    color: '#F44336',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#0C6B58',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});

export default SettingsScreen;
