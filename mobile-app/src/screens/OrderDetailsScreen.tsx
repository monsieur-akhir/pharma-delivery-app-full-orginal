import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { COLORS, SIZES } from '../constants';

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { orderId } = route.params as { orderId: number };

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/api/orders/${orderId}`);
        
        if (response.data.status === 'success') {
          setOrder(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load order details');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Network error. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Get status color based on order status
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return COLORS.success;
      case 'PENDING':
        return COLORS.warning;
      case 'PROCESSING':
        return COLORS.info;
      case 'CANCELLED':
        return COLORS.error;
      case 'DELIVERED':
        return COLORS.success;
      default:
        return COLORS.gray;
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'failed':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(order?.status) }
            ]}
          >
            <Text style={styles.statusText}>{order?.status}</Text>
          </View>
          <Text style={styles.orderNumberText}>Order #{order?.order_number}</Text>
          <Text style={styles.dateText}>{formatDate(order?.created_at)}</Text>
        </View>

        {/* Order Items */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order?.order_items?.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.medicine?.name}</Text>
                <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{item.total_price.toLocaleString()} XOF</Text>
            </View>
          ))}
        </View>

        {/* Payment Details */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method:</Text>
            <Text style={styles.detailValue}>
              {order?.payment_method === 'CARD' ? 'Credit/Debit Card' :
               order?.payment_method === 'MOBILE_MONEY' ? `Mobile Money (${order?.payment_provider})` :
               order?.payment_method}
            </Text>
          </View>
          {order?.payment_provider && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider:</Text>
              <Text style={styles.detailValue}>{order?.payment_provider}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View 
              style={[
                styles.paymentStatusBadge, 
                { backgroundColor: getPaymentStatusColor(order?.payment_status) }
              ]}
            >
              <Text style={styles.paymentStatusText}>{order?.payment_status}</Text>
            </View>
          </View>
          {order?.transaction_reference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction:</Text>
              <Text style={styles.detailValue}>{order?.transaction_reference}</Text>
            </View>
          )}
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>{order?.total_amount.toLocaleString()} XOF</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{order?.delivery_address}</Text>
          </View>
          {order?.expected_delivery_time && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected:</Text>
              <Text style={styles.detailValue}>{formatDate(order?.expected_delivery_time)}</Text>
            </View>
          )}
          {order?.actual_delivery_time && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivered:</Text>
              <Text style={styles.detailValue}>{formatDate(order?.actual_delivery_time)}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {order?.status === 'PENDING' && order?.payment_status === 'completed' && (
            <Text style={styles.processingNote}>
              Your order is being processed. We will notify you when it's on the way.
            </Text>
          )}
          
          {order?.status === 'PENDING' && order?.payment_status === 'pending' && (
            <TouchableOpacity
              style={styles.verifyPaymentButton}
              onPress={() => {
                if (order?.payment_method === 'MOBILE_MONEY') {
                  navigation.navigate('MobileMoneyPayment', { 
                    orderId: order.id,
                    amount: order.total_amount,
                    transactionReference: order.transaction_reference
                  });
                } else {
                  navigation.navigate('CardPayment', { 
                    orderId: order.id,
                    amount: order.total_amount
                  });
                }
              }}
            >
              <Text style={styles.verifyPaymentButtonText}>Complete Payment</Text>
            </TouchableOpacity>
          )}
          
          {order?.status === 'DELIVERED' && !order?.rating && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => navigation.navigate('RateOrder', { orderId: order.id })}
            >
              <Text style={styles.rateButtonText}>Rate Your Experience</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => navigation.navigate('Support', { orderId: order.id })}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  backButton: {
    marginRight: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.white,
  },
  errorTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.error,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  errorMessage: {
    fontSize: SIZES.font,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
    padding: SIZES.padding,
    backgroundColor: COLORS.lightGray2,
    borderRadius: SIZES.radius,
  },
  statusBadge: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  orderNumberText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginBottom: SIZES.base / 2,
    color: COLORS.text,
  },
  dateText: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  sectionContainer: {
    marginBottom: SIZES.padding * 2,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    marginBottom: SIZES.padding,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: SIZES.base,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: SIZES.font,
    fontWeight: '500',
    marginBottom: 2,
    color: COLORS.text,
  },
  itemQuantity: {
    fontSize: SIZES.small,
    color: COLORS.gray,
  },
  itemPrice: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SIZES.base,
  },
  detailLabel: {
    width: 100,
    fontSize: SIZES.font,
    color: COLORS.gray,
  },
  detailValue: {
    flex: 1,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  paymentStatusBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: SIZES.radius / 2,
  },
  paymentStatusText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: SIZES.base,
    paddingTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  totalLabel: {
    width: 120,
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    flex: 1,
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
  },
  actionsContainer: {
    marginBottom: SIZES.padding * 2,
  },
  processingNote: {
    fontSize: SIZES.font,
    color: COLORS.info,
    textAlign: 'center',
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    backgroundColor: COLORS.lightGray2,
    borderRadius: SIZES.radius,
  },
  verifyPaymentButton: {
    backgroundColor: COLORS.warning,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  verifyPaymentButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  rateButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  rateButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  supportButton: {
    backgroundColor: COLORS.lightGray2,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  supportButtonText: {
    color: COLORS.text,
    fontSize: SIZES.font,
    fontWeight: '500',
  },
});

export default OrderDetailsScreen;