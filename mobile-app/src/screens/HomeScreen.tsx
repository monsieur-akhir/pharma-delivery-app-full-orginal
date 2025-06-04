import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

type Delivery = {
  id: number;
  orderId: string;
  status: 'pending' | 'preparing' | 'in_transit' | 'delivered';
  estimatedDelivery: string;
  pharmacy: {
    name: string;
    address: string;
    distance: string;
  };
};

type Reminder = {
  id: number;
  medicationName: string;
  dosage: string;
  time: string;
  date: string;
};

type Order = {
  id: number;
  orderId: string;
  date: string;
  status: 'processing' | 'confirmed' | 'shipped' | 'delivered';
  total: string;
  items: number;
};

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // These would be actual API calls in production
      // For demo, we'll use mock data
      
      // Simulating API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      setActiveDeliveries([
        {
          id: 1,
          orderId: 'ORD-123456',
          status: 'in_transit',
          estimatedDelivery: '15 min',
          pharmacy: {
            name: 'Central Pharmacy',
            address: '123 Main St',
            distance: '1.2 km',
          },
        },
      ]);
      
      setUpcomingReminders([
        {
          id: 1,
          medicationName: 'Amoxicillin',
          dosage: '250mg',
          time: '12:30 PM',
          date: 'Today',
        },
        {
          id: 2,
          medicationName: 'Lisinopril',
          dosage: '10mg',
          time: '8:00 PM',
          date: 'Today',
        },
      ]);
      
      setRecentOrders([
        {
          id: 1,
          orderId: 'ORD-123456',
          date: '2025-05-10',
          status: 'confirmed',
          total: '$45.99',
          items: 3,
        },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderActiveDeliveries = () => {
    if (activeDeliveries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <FontAwesome5 name="truck" size={32} color="#0C6B58" />
          <Text style={styles.emptyStateText}>No active deliveries</Text>
        </View>
      );
    }

    return activeDeliveries.map(delivery => (
      <TouchableOpacity
        key={delivery.id}
        style={styles.deliveryCard}
        onPress={() => 
          navigation.navigate('DeliveryTracking', { 
            deliveryId: delivery.id,
            orderId: delivery.orderId,
            userId: user?.id
          })
        }
      >
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryStatus}>
            <View
              style={[
                styles.statusDot,
                delivery.status === 'in_transit' && styles.statusInTransit,
              ]}
            />
            <Text style={styles.statusText}>
              {delivery.status === 'in_transit' ? 'In Transit' : 'Preparing'}
            </Text>
          </View>
          <Text style={styles.estimatedTime}>{delivery.estimatedDelivery}</Text>
        </View>
        
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryTitle}>Order #{delivery.orderId}</Text>
          <Text style={styles.pharmacyName}>{delivery.pharmacy.name}</Text>
          <Text style={styles.pharmacyAddress}>{delivery.pharmacy.address}</Text>
        </View>
        
        <View style={styles.deliveryFooter}>
          <MaterialIcons name="directions" size={18} color="#0C6B58" />
          <Text style={styles.trackText}>Track Delivery</Text>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderUpcomingReminders = () => {
    if (upcomingReminders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="notifications-none" size={32} color="#0C6B58" />
          <Text style={styles.emptyStateText}>No upcoming reminders</Text>
        </View>
      );
    }

    return upcomingReminders.map(reminder => (
      <View key={reminder.id} style={styles.reminderCard}>
        <View style={styles.reminderTime}>
          <Text style={styles.reminderTimeText}>{reminder.time}</Text>
          <Text style={styles.reminderDateText}>{reminder.date}</Text>
        </View>
        
        <View style={styles.reminderInfo}>
          <Text style={styles.reminderTitle}>{reminder.medicationName}</Text>
          <Text style={styles.reminderDosage}>{reminder.dosage}</Text>
        </View>
        
        <TouchableOpacity style={styles.reminderAction}>
          <MaterialIcons name="check-circle" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>
    ));
  };

  const renderRecentOrders = () => {
    if (recentOrders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="shopping-bag" size={32} color="#0C6B58" />
          <Text style={styles.emptyStateText}>No recent orders</Text>
        </View>
      );
    }

    return recentOrders.map(order => (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        onPress={() => Alert.alert('Order Details', `Details for ${order.orderId}`)}
      >
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>Order #{order.orderId}</Text>
          <Text style={styles.orderDate}>{order.date}</Text>
          <View style={styles.orderDetails}>
            <Text style={styles.orderItems}>{order.items} items</Text>
            <Text style={styles.orderTotal}>{order.total}</Text>
          </View>
        </View>
        
        <View style={styles.orderStatus}>
          <View
            style={[
              styles.orderStatusDot,
              order.status === 'confirmed' && styles.statusConfirmed,
              order.status === 'shipped' && styles.statusShipped,
              order.status === 'delivered' && styles.statusDelivered,
            ]}
          />
          <Text style={styles.orderStatusText}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {user?.username || 'User'}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialIcons name="person" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PharmacyList')}
          >
            <View style={styles.actionIcon}>
              <FontAwesome5 name="clinic-medical" size={20} color="#0C6B58" />
            </View>
            <Text style={styles.actionText}>Pharmacies</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Prescriptions')}
          >
            <View style={styles.actionIcon}>
              <FontAwesome5 name="file-prescription" size={20} color="#0C6B58" />
            </View>
            <Text style={styles.actionText}>Prescriptions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Medications')}
          >
            <View style={styles.actionIcon}>
              <FontAwesome5 name="pills" size={20} color="#0C6B58" />
            </View>
            <Text style={styles.actionText}>Medications</Text>
          </TouchableOpacity>
        </View>

        {/* Active Deliveries */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Deliveries</Text>
          {renderActiveDeliveries()}
        </View>

        {/* Medication Reminders */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
          {renderUpcomingReminders()}
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {renderRecentOrders()}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', onPress: logout, style: 'destructive' },
                ]
              );
            }}
          >
            <MaterialIcons name="logout" size={18} color="#ff4d4d" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#333',
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFC107',
    marginRight: 6,
  },
  statusInTransit: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  deliveryInfo: {
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pharmacyName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  pharmacyAddress: {
    fontSize: 13,
    color: '#666',
  },
  deliveryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  trackText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#0C6B58',
  },
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  reminderTime: {
    backgroundColor: '#e6f7f4',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    width: 75,
  },
  reminderTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  reminderDateText: {
    fontSize: 12,
    color: '#0C6B58',
    marginTop: 2,
  },
  reminderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reminderDosage: {
    fontSize: 14,
    color: '#666',
  },
  reminderAction: {
    padding: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItems: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFC107',
    marginBottom: 4,
  },
  statusConfirmed: {
    backgroundColor: '#4CAF50',
  },
  statusShipped: {
    backgroundColor: '#2196F3',
  },
  statusDelivered: {
    backgroundColor: '#9C27B0',
  },
  orderStatusText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ff4d4d',
  },
});

export default HomeScreen;