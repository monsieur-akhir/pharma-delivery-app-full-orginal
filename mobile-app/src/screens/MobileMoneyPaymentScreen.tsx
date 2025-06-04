import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { MobileMoneyProvider } from '../types/payment';
import { COLORS, FONTS, SIZES } from '../constants';

const MobileMoneyPaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { orderId, amount } = route.params as { orderId: number; amount: number };

  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<{ code: string; name: string }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch available mobile money providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/payments/mobile-money/providers');
        
        if (response.data.status === 'success' && response.data.data.enabled) {
          setProviders(response.data.data.providers);
          // If user has a phone number, pre-fill it
          if (user?.phone) {
            setPhoneNumber(user.phone);
          }
        } else {
          Alert.alert('Error', 'Mobile money payment is not available');
          navigation.goBack();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load payment providers');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Initiate mobile money payment
  const initiatePayment = async () => {
    if (!selectedProvider) {
      Alert.alert('Error', 'Please select a payment provider');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/api/payments/mobile-money/initiate', {
        userId: user?.id,
        orderId,
        amount,
        provider: selectedProvider,
        phoneNumber,
        currency: 'XOF', // West African CFA Franc
      });

      if (response.data.status === 'success') {
        setTransactionReference(response.data.data.transactionReference);
        setPaymentStatus('pending');
        setStatusMessage(response.data.data.message);
      } else {
        Alert.alert('Payment Error', response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate payment');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify payment status
  const verifyPayment = async () => {
    if (!transactionReference) return;

    try {
      setIsLoading(true);
      const response = await api.post('/api/payments/mobile-money/verify', {
        transactionReference,
        orderId,
      });

      if (response.data.status === 'success') {
        const paymentResult = response.data.data;
        setPaymentStatus(paymentResult.status as any);
        setStatusMessage(paymentResult.message);

        if (paymentResult.status === 'completed') {
          Alert.alert('Success', 'Payment completed successfully', [
            { text: 'OK', onPress: () => navigation.navigate('OrderDetails', { orderId }) }
          ]);
        } else if (paymentResult.status === 'failed') {
          Alert.alert('Payment Failed', paymentResult.message);
        }
      } else {
        Alert.alert('Verification Error', response.data.message || 'Failed to verify payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify payment status');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Provider selection component
  const ProviderOption = ({ provider, selected, onSelect }) => (
    <TouchableOpacity
      style={[styles.providerOption, selected && styles.selectedProvider]}
      onPress={() => onSelect(provider.code)}
    >
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{provider.name}</Text>
      </View>
      {selected && <Icon name="checkmark-circle" size={24} color={COLORS.primary} />}
    </TouchableOpacity>
  );

  // Payment initiation view
  const renderPaymentForm = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      {providers.map((provider) => (
        <ProviderOption
          key={provider.code}
          provider={provider}
          selected={selectedProvider === provider.code}
          onSelect={setSelectedProvider}
        />
      ))}

      <Text style={styles.sectionTitle}>Enter Phone Number</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Phone number (e.g., +225XXXXXXXX)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Payment Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Order ID:</Text>
          <Text style={styles.summaryValue}>{orderId}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount:</Text>
          <Text style={styles.summaryValue}>{amount.toLocaleString()} XOF</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.payButton}
        onPress={initiatePayment}
        disabled={isLoading || !selectedProvider || !phoneNumber}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.payButtonText}>Pay Now</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  // Payment status view
  const renderPaymentStatus = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIconContainer}>
        {paymentStatus === 'pending' && (
          <Icon name="time-outline" size={64} color={COLORS.warning} />
        )}
        {paymentStatus === 'completed' && (
          <Icon name="checkmark-circle-outline" size={64} color={COLORS.success} />
        )}
        {paymentStatus === 'failed' && (
          <Icon name="close-circle-outline" size={64} color={COLORS.error} />
        )}
      </View>
      
      <Text style={styles.statusTitle}>
        {paymentStatus === 'pending' && 'Payment Processing'}
        {paymentStatus === 'completed' && 'Payment Successful'}
        {paymentStatus === 'failed' && 'Payment Failed'}
      </Text>
      
      <Text style={styles.statusMessage}>{statusMessage}</Text>
      
      <Text style={styles.referenceText}>
        Transaction Reference: {transactionReference}
      </Text>

      {paymentStatus === 'pending' && (
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={verifyPayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.verifyButtonText}>Check Payment Status</Text>
          )}
        </TouchableOpacity>
      )}

      {paymentStatus === 'failed' && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setPaymentStatus('idle')}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}

      {paymentStatus === 'completed' && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('OrderDetails', { orderId })}
        >
          <Text style={styles.doneButtonText}>View Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mobile Money Payment</Text>
      </View>

      {isLoading && paymentStatus === 'idle' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading payment options...</Text>
        </View>
      ) : paymentStatus === 'idle' ? (
        renderPaymentForm()
      ) : (
        renderPaymentStatus()
      )}
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
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    marginVertical: SIZES.padding,
    color: COLORS.text,
  },
  providerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
  },
  selectedProvider: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightPrimary,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    fontSize: SIZES.font,
    fontWeight: '500',
    marginLeft: SIZES.base,
    color: COLORS.text,
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    fontSize: SIZES.font,
  },
  summaryContainer: {
    backgroundColor: COLORS.lightGray2,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginVertical: SIZES.padding,
  },
  summaryTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    marginBottom: SIZES.base,
    color: COLORS.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    color: COLORS.gray,
    fontSize: SIZES.font,
  },
  summaryValue: {
    fontWeight: 'bold',
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  statusIconContainer: {
    marginBottom: SIZES.padding * 2,
  },
  statusTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginBottom: SIZES.padding,
    color: COLORS.text,
  },
  statusMessage: {
    fontSize: SIZES.font,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
    color: COLORS.text,
  },
  referenceText: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: SIZES.padding * 2,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: COLORS.warning,
    width: '100%',
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: COLORS.success,
    width: '100%',
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
});

export default MobileMoneyPaymentScreen;