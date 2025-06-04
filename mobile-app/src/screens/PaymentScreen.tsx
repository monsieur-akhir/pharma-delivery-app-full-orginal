import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '@/navigation/AppNavigator';
import { getOrderById, updateOrderStatus } from '@/store/slices/orderSlice';
import { AppDispatch, RootState } from '@/store';
import { Feather } from '@expo/vector-icons';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

type PaymentScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Payment'>;
type PaymentScreenRouteProp = RouteProp<MainStackParamList, 'Payment'>;

interface Props {
  navigation: PaymentScreenNavigationProp;
  route: PaymentScreenRouteProp;
}

const PaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('CARD');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { currentOrder, isLoading } = useSelector((state: RootState) => state.order);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  // Get orderId from route params
  const { orderId } = route.params;

  // Load order details
  useEffect(() => {
    if (orderId) {
      dispatch(getOrderById(orderId));
    }
  }, [orderId]);

  // Initialize payment sheet when order is loaded
  useEffect(() => {
    if (currentOrder && paymentMethod === 'CARD') {
      initializePaymentSheet();
    }
  }, [currentOrder, paymentMethod]);

  const initializePaymentSheet = async () => {
    if (!currentOrder) return;
    
    try {
      // In a real implementation, you would fetch the payment intent from your server
      // This is a mock implementation for demo purposes
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Medi-Delivery',
        paymentIntentClientSecret: 'mock_client_secret', // Replace with actual client secret from your server
        customerEphemeralKeySecret: 'mock_ephemeral_key',
        customerId: 'mock_customer_id',
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: 'John Doe',
        }
      });
      
      if (error) {
        console.error('Error initializing payment sheet:', error);
      }
    } catch (error) {
      console.error('Failed to initialize payment sheet:', error);
    }
  };

  const handlePayWithCard = async () => {
    if (!currentOrder) return;
    
    try {
      setPaymentProcessing(true);
      
      // Open the payment sheet
      const { error } = await presentPaymentSheet();
      
      if (error) {
        console.error('Payment failed:', error);
        Alert.alert('Payment Failed', error.message);
      } else {
        // Payment successful
        handlePaymentSuccess();
      }
    } catch (error) {
      console.error('Error presenting payment sheet:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayWithMobileMoney = async () => {
    if (!currentOrder) return;
    
    try {
      setPaymentProcessing(true);
      
      // Simulate mobile money payment
      // In a real implementation, you would integrate with a mobile money provider API
      setTimeout(() => {
        handlePaymentSuccess();
        setPaymentProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Mobile money payment failed:', error);
      Alert.alert('Error', 'Failed to process mobile money payment. Please try again.');
      setPaymentProcessing(false);
    }
  };

  const handlePayCash = async () => {
    if (!currentOrder) return;
    
    try {
      setPaymentProcessing(true);
      
      // Update order status to indicate cash on delivery
      await dispatch(updateOrderStatus({ 
        id: currentOrder.id, 
        status: 'PAYMENT_COMPLETED' 
      })).unwrap();
      
      handlePaymentSuccess();
    } catch (error) {
      console.error('Failed to update order status:', error);
      Alert.alert('Error', 'Failed to process request. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    Alert.alert(
      'Payment Successful',
      'Your order has been placed successfully.',
      [
        {
          text: 'Track Order',
          onPress: () => {
            if (currentOrder) {
              navigation.navigate('OrderTracking', { orderId: currentOrder.id });
            }
          },
        },
      ]
    );
  };

  if (isLoading || !currentOrder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A80F0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Choose your payment method</Text>
        
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Number</Text>
            <Text style={styles.summaryValue}>{currentOrder.orderNumber}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pharmacy</Text>
            <Text style={styles.summaryValue}>{currentOrder.pharmacy.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{currentOrder.items.length} items</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${currentOrder.subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${currentOrder.deliveryFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${currentOrder.total.toFixed(2)}</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onSelect={setPaymentMethod}
        />
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Notes</Text>
          <View style={styles.instruction}>
            <Feather name="info" size={20} color="#4A80F0" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>
              Your payment information is securely processed and we do not store your card details.
            </Text>
          </View>
          {paymentMethod === 'CASH' && (
            <View style={styles.instruction}>
              <Feather name="dollar-sign" size={20} color="#4A80F0" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Please have the exact amount ready for the delivery person.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.payButton, paymentProcessing && styles.disabledButton]}
          onPress={
            paymentMethod === 'CARD' 
              ? handlePayWithCard 
              : paymentMethod === 'MOBILE_MONEY' 
                ? handlePayWithMobileMoney 
                : handlePayCash
          }
          disabled={paymentProcessing}
        >
          {paymentProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>
              {paymentMethod === 'CASH' 
                ? 'Confirm Cash on Delivery' 
                : `Pay $${currentOrder.total.toFixed(2)}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A80F0',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  instruction: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionIcon: {
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  payButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentScreen;
