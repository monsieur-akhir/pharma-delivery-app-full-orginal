
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { COLORS, SIZES } from '../constants';

interface Order {
  id: number;
  order_number: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
  expected_delivery_time?: string;
  actual_delivery_time?: string;
  delivery_address: string;
  pharmacy?: {
    id: number;
    name: string;
    address: string;
    phone: string;
  };
  order_items?: Array<{
    id: number;
    quantity: number;
    total_price: number;
    medicine?: {
      id: number;
      name: string;
      dosage?: string;
    };
  }>;
}

const OrdersScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [filter])
  );

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/orders?filter=${filter}&limit=50`);
      
      if (response.data.status === 'success') {
        setOrders(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return COLORS.warning;
      case 'CONFIRMED':
      case 'PREPARING':
        return COLORS.info;
      case 'READY':
        return COLORS.primary;
      case 'DELIVERED':
        return COLORS.success;
      case 'CANCELLED':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'time-outline';
      case 'CONFIRMED':
        return 'checkmark-circle-outline';
      case 'PREPARING':
        return 'construct-outline';
      case 'READY':
        return 'cube-outline';
      case 'DELIVERED':
        return 'checkmark-done-outline';
      case 'CANCELLED':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilteredOrders = () => {
    switch (filter) {
      case 'active':
        return orders.filter(order => 
          ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
        );
      case 'completed':
        return orders.filter(order => 
          ['DELIVERED', 'CANCELLED'].includes(order.status)
        );
      default:
        return orders;
    }
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  const handleTrackOrder = (order: Order) => {
    if (['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)) {
      navigation.navigate('TrackOrder', { 
        orderId: order.id,
        orderNumber: order.order_number 
      });
    }
  };

  const renderFilterButton = (filterType: typeof filter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item: order }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(order)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Icon 
            name={getStatusIcon(order.status)} 
            size={16} 
            color={COLORS.white} 
          />
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      {order.pharmacy && (
        <View style={styles.pharmacyInfo}>
          <Icon name="storefront-outline" size={16} color={COLORS.gray} />
          <Text style={styles.pharmacyName}>{order.pharmacy.name}</Text>
        </View>
      )}

      <View style={styles.orderDetails}>
        <View style={styles.itemsInfo}>
          <Text style={styles.itemsCount}>
            {order.order_items?.length || 0} item(s)
          </Text>
          <Text style={styles.totalAmount}>
            {order.total_amount.toLocaleString()} XOF
          </Text>
        </View>
        
        <View style={styles.paymentInfo}>
          <View style={[
            styles.paymentStatusDot,
            { backgroundColor: order.payment_status === 'completed' ? COLORS.success : COLORS.warning }
          ]} />
          <Text style={styles.paymentStatus}>
            Payment {order.payment_status}
          </Text>
        </View>
      </View>

      {order.expected_delivery_time && (
        <View style={styles.deliveryInfo}>
          <Icon name="time-outline" size={16} color={COLORS.gray} />
          <Text style={styles.deliveryTime}>
            Expected: {formatDate(order.expected_delivery_time)}
          </Text>
        </View>
      )}

      <View style={styles.orderActions}>
        {['CONFIRMED', 'PREPARING', 'READY'].includes(order.status) && (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => handleTrackOrder(order)}
          >
            <Icon name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'DELIVERED' && !order.actual_delivery_time && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => navigation.navigate('RateOrder', { orderId: order.id })}
          >
            <Icon name="star-outline" size={16} color={COLORS.warning} />
            <Text style={styles.rateButtonText}>Rate Order</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleOrderPress(order)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Icon name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="receipt-outline" size={64} color={COLORS.gray} />
      <Text style={styles.emptyTitle}>
        {filter === 'active' ? 'No Active Orders' : 
         filter === 'completed' ? 'No Completed Orders' : 'No Orders Yet'}
      </Text>
      <Text style={styles.emptyMessage}>
        {filter === 'active' 
          ? 'You have no active orders at the moment'
          : filter === 'completed'
          ? 'You have no completed orders'
          : 'Start shopping to see your orders here'
        }
      </Text>
      {filter === 'all' && (
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('Pharmacies')}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </SafeAreaView>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {/* Implement search functionality */}}
        >
          <Icon name="search-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('active', 'Active')}
        {renderFilterButton('completed', 'Completed')}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
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
  searchButton: {
    padding: SIZES.base,
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
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
    gap: 4,
  },
  statusText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  pharmacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
    gap: SIZES.base,
  },
  pharmacyName: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  orderDetails: {
    marginBottom: SIZES.base,
  },
  itemsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemsCount: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  totalAmount: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  paymentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentStatus: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
    marginBottom: SIZES.base,
  },
  deliveryTime: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SIZES.base,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SIZES.base,
  },
  trackButtonText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '500',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SIZES.base,
  },
  rateButtonText: {
    fontSize: SIZES.small,
    color: COLORS.warning,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '500',
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
    marginBottom: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
});

export default OrdersScreen;
