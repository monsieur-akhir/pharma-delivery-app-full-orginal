
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { api } from '../services/api';

interface OrderStatus {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  timestamp: string;
  description: string;
  location?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  pharmacy: {
    name: string;
    address: string;
    phone: string;
  };
  deliveryAddress: string;
  estimatedDeliveryTime?: string;
  trackingHistory: OrderStatus[];
  deliveryPerson?: {
    name: string;
    phone: string;
  };
}

const TrackOrderScreen: React.FC = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrderDetails();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'CONFIRMED':
        return 'check-circle';
      case 'PREPARING':
        return 'build';
      case 'READY':
        return 'done-all';
      case 'IN_TRANSIT':
        return 'local-shipping';
      case 'DELIVERED':
        return 'delivery-dining';
      case 'CANCELLED':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFC107';
      case 'CONFIRMED':
        return '#2196F3';
      case 'PREPARING':
        return '#FF9800';
      case 'READY':
        return '#4CAF50';
      case 'IN_TRANSIT':
        return '#9C27B0';
      case 'DELIVERED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderTrackingStep = (step: OrderStatus, index: number, isLast: boolean) => (
    <View key={step.id} style={styles.trackingStep}>
      <View style={styles.stepIndicator}>
        <View style={[
          styles.stepDot,
          { backgroundColor: getStatusColor(step.status) }
        ]}>
          <MaterialIcons 
            name={getStatusIcon(step.status)} 
            size={16} 
            color="#fff" 
          />
        </View>
        {!isLast && <View style={styles.stepLine} />}
      </View>
      
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{step.description}</Text>
        <Text style={styles.stepTime}>
          {new Date(step.timestamp).toLocaleString()}
        </Text>
        {step.location && (
          <Text style={styles.stepLocation}>{step.location}</Text>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C6B58" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <TouchableOpacity onPress={onRefresh}>
          <MaterialIcons name="refresh" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
          <View style={[
            styles.currentStatusBadge,
            { backgroundColor: getStatusColor(order.status) }
          ]}>
            <Text style={styles.currentStatusText}>{order.status}</Text>
          </View>
        </View>

        {/* Estimated Delivery */}
        {order.estimatedDeliveryTime && (
          <View style={styles.estimatedDelivery}>
            <MaterialIcons name="schedule" size={24} color="#0C6B58" />
            <View style={styles.estimatedDeliveryText}>
              <Text style={styles.estimatedLabel}>Estimated Delivery</Text>
              <Text style={styles.estimatedTime}>
                {new Date(order.estimatedDeliveryTime).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Delivery Person */}
        {order.deliveryPerson && (
          <View style={styles.deliveryPerson}>
            <FontAwesome5 name="motorcycle" size={24} color="#0C6B58" />
            <View style={styles.deliveryPersonInfo}>
              <Text style={styles.deliveryPersonName}>
                {order.deliveryPerson.name}
              </Text>
              <Text style={styles.deliveryPersonRole}>Delivery Person</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <MaterialIcons name="phone" size={20} color="#0C6B58" />
            </TouchableOpacity>
          </View>
        )}

        {/* Pharmacy Info */}
        <View style={styles.pharmacyInfo}>
          <Text style={styles.sectionTitle}>Pharmacy</Text>
          <Text style={styles.pharmacyName}>{order.pharmacy.name}</Text>
          <Text style={styles.pharmacyAddress}>{order.pharmacy.address}</Text>
          <TouchableOpacity style={styles.pharmacyCallButton}>
            <MaterialIcons name="phone" size={16} color="#0C6B58" />
            <Text style={styles.pharmacyCallText}>Call Pharmacy</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        <View style={styles.deliveryInfo}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.deliveryAddress}>{order.deliveryAddress}</Text>
        </View>

        {/* Tracking History */}
        <View style={styles.trackingHistory}>
          <Text style={styles.sectionTitle}>Tracking History</Text>
          {order.trackingHistory.map((step, index) => 
            renderTrackingStep(step, index, index === order.trackingHistory.length - 1)
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {order.status === 'IN_TRANSIT' && (
            <TouchableOpacity
              style={styles.trackOnMapButton}
              onPress={() => navigation.navigate('DeliveryTracking', {
                orderId: order.id,
                deliveryPersonId: order.deliveryPerson?.id,
              })}
            >
              <MaterialIcons name="map" size={20} color="#fff" />
              <Text style={styles.trackOnMapText}>Track on Map</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => navigation.navigate('Support', { orderId: order.id })}
          >
            <MaterialIcons name="support-agent" size={20} color="#0C6B58" />
            <Text style={styles.supportText}>Contact Support</Text>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  estimatedDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estimatedDeliveryText: {
    marginLeft: 12,
  },
  estimatedLabel: {
    fontSize: 14,
    color: '#666',
  },
  estimatedTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C6B58',
  },
  deliveryPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryPersonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryPersonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deliveryPersonRole: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
  },
  pharmacyInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  pharmacyCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  pharmacyCallText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#0C6B58',
    fontWeight: '500',
  },
  deliveryInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  trackingHistory: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  stepLocation: {
    fontSize: 14,
    color: '#0C6B58',
  },
  actionButtons: {
    marginBottom: 20,
  },
  trackOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C6B58',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  trackOnMapText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#0C6B58',
  },
  supportText: {
    color: '#0C6B58',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: '#0C6B58',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrackOrderScreen;
