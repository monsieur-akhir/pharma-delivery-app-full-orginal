
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { COLORS, SIZES } from '../constants';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'ORDER' | 'DELIVERY' | 'PRESCRIPTION' | 'REMINDER' | 'PROMOTION' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isRead: boolean;
  data?: any;
  createdAt: string;
  readAt?: string;
}

interface NotificationPreferences {
  orderUpdates: boolean;
  deliveryNotifications: boolean;
  medicationReminders: boolean;
  prescriptionStatus: boolean;
  promotions: boolean;
  systemNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    deliveryNotifications: true,
    medicationReminders: true,
    prescriptionStatus: true,
    promotions: true,
    systemNotifications: true,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      fetchPreferences();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/notifications?limit=50');
      
      if (response.data.status === 'success') {
        setNotifications(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/api/notifications/preferences');
      
      if (response.data.status === 'success') {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await api.put('/api/notifications/mark-all-read');
      
      if (response.data.status === 'success') {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/notifications/${notificationId}`);
              setNotifications(prev => prev.filter(n => n.id !== notificationId));
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const updatedPreferences = { ...preferences, [key]: value };
      setPreferences(updatedPreferences);
      
      await api.put('/api/notifications/preferences', updatedPreferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setPreferences(preferences); // Revert on error
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    switch (notification.type) {
      case 'ORDER':
        if (notification.data?.orderId) {
          navigation.navigate('OrderDetails', { orderId: notification.data.orderId });
        }
        break;
      case 'DELIVERY':
        if (notification.data?.orderId) {
          navigation.navigate('TrackOrder', { orderId: notification.data.orderId });
        }
        break;
      case 'PRESCRIPTION':
        if (notification.data?.prescriptionId) {
          navigation.navigate('PrescriptionDetail', { prescriptionId: notification.data.prescriptionId });
        }
        break;
      case 'REMINDER':
        navigation.navigate('MedicationReminders');
        break;
      default:
        // Show notification details
        break;
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'ORDER':
        return 'receipt-outline';
      case 'DELIVERY':
        return 'car-outline';
      case 'PRESCRIPTION':
        return 'document-text-outline';
      case 'REMINDER':
        return 'alarm-outline';
      case 'PROMOTION':
        return 'gift-outline';
      case 'SYSTEM':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'URGENT') return COLORS.error;
    if (priority === 'HIGH') return COLORS.warning;
    
    switch (type) {
      case 'ORDER':
        return COLORS.primary;
      case 'DELIVERY':
        return COLORS.success;
      case 'PRESCRIPTION':
        return COLORS.info;
      case 'REMINDER':
        return COLORS.warning;
      case 'PROMOTION':
        return COLORS.secondary;
      default:
        return COLORS.gray;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      default:
        return notifications;
    }
  };

  const renderNotificationItem = ({ item: notification }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(notification.type, notification.priority) + '20' }
        ]}>
          <Icon
            name={getNotificationIcon(notification.type, notification.priority)}
            size={24}
            color={getNotificationColor(notification.type, notification.priority)}
          />
        </View>
        
        <View style={styles.notificationText}>
          <View style={styles.notificationHeader}>
            <Text style={[
              styles.notificationTitle,
              !notification.isRead && styles.unreadTitle
            ]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          
          <View style={styles.notificationFooter}>
            <View style={[
              styles.typeBadge,
              { backgroundColor: getNotificationColor(notification.type, notification.priority) }
            ]}>
              <Text style={styles.typeText}>{notification.type}</Text>
            </View>
            
            {notification.priority === 'URGENT' && (
              <View style={styles.urgentBadge}>
                <Icon name="warning" size={12} color={COLORS.white} />
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(notification.id)}
        >
          <Icon name="close" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
      
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Notification Preferences</Text>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Content Types</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Order Updates</Text>
          <Switch
            value={preferences.orderUpdates}
            onValueChange={(value) => updatePreference('orderUpdates', value)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '60' }}
            thumbColor={preferences.orderUpdates ? COLORS.primary : COLORS.gray}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Delivery Notifications</Text>
          <Switch
            value={preferences.deliveryNotifications}
            onValueChange={(value) => updatePreference('deliveryNotifications', value)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '60' }}
            thumbColor={preferences.deliveryNotifications ? COLORS.primary : COLORS.gray}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Medication Reminders</Text>
          <Switch
            value={preferences.medicationReminders}
            onValueChange={(value) => updatePreference('medicationReminders', value)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '60' }}
            thumbColor={preferences.medicationReminders ? COLORS.primary : COLORS.gray}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Prescription Status</Text>
          <Switch
            value={preferences.prescriptionStatus}
            onValueChange={(value) => updatePreference('prescriptionStatus', value)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '60' }}
            thumbColor={preferences.prescriptionStatus ? COLORS.primary : COLORS.gray}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Promotions</Text>
          <Switch
            value={preferences.promotions}
            onValueChange={(value) => updatePreference('promotions', value)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '60' }}
            thumbColor={preferences.promotions ? COLORS.primary : COLORS.gray}
          />
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Delivery Methods</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={preferences.pushNotifications}
            onValueChange={(value) => updatePreference('pushNotifications', value)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '60' }}
            thumbColor={preferences.pushNotifications ? COLORS.primary : COLORS.gray}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Email Notifications</Text>
          <Switch
            value={preferences.emailNotifications}
            onValueChange={(value) => updatePreference('emailNotifications', value)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '60' }}
            thumbColor={preferences.emailNotifications ? COLORS.primary : COLORS.gray}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>SMS Notifications</Text>
          <Switch
            value={preferences.smsNotifications}
            onValueChange={(value) => updatePreference('smsNotifications', value)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '60' }}
            thumbColor={preferences.smsNotifications ? COLORS.primary : COLORS.gray}
          />
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="notifications-outline" size={64} color={COLORS.gray} />
      <Text style={styles.emptyTitle}>
        {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
      </Text>
      <Text style={styles.emptyMessage}>
        {filter === 'unread' 
          ? 'All caught up! You have no unread notifications.'
          : 'You\'ll see important updates and reminders here.'
        }
      </Text>
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </SafeAreaView>
    );
  }

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Icon name="settings-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={markAllAsRead}
            >
              <Icon name="checkmark-done-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSettings ? (
        <ScrollView style={styles.scrollView}>
          {renderSettings()}
        </ScrollView>
      ) : (
        <>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'all' && styles.activeFilterButton
              ]}
              onPress={() => setFilter('all')}
            >
              <Text style={[
                styles.filterButtonText,
                filter === 'all' && styles.activeFilterButtonText
              ]}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'unread' && styles.activeFilterButton
              ]}
              onPress={() => setFilter('unread')}
            >
              <Text style={[
                styles.filterButtonText,
                filter === 'unread' && styles.activeFilterButtonText
              ]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SIZES.base,
  },
  headerButton: {
    padding: SIZES.base,
  },
  scrollView: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterButton: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    marginRight: SIZES.base,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray2,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  activeFilterButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: SIZES.padding,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.base / 2,
  },
  notificationTitle: {
    fontSize: SIZES.font,
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.base,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  notificationMessage: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SIZES.base,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  typeBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  urgentText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: SIZES.base,
  },
  unreadDot: {
    position: 'absolute',
    top: SIZES.padding,
    right: SIZES.padding,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding * 3,
  },
  emptyTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  emptyMessage: {
    fontSize: SIZES.font,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SIZES.padding,
  },
  settingsContainer: {
    padding: SIZES.padding,
  },
  settingsTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  settingsSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingLabel: {
    fontSize: SIZES.font,
    color: COLORS.text,
  },
});

export default NotificationsScreen;
