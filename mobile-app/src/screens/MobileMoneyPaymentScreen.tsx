import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '@/navigation/AppNavigator';
import { AppDispatch, RootState } from '@/store';
import { Feather } from '@expo/vector-icons';
import { paymentService } from '@/services/payment.service';

type MobileMoneyPaymentScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MobileMoneyPayment'>;
type MobileMoneyPaymentScreenRouteProp = RouteProp<MainStackParamList, 'MobileMoneyPayment'>;

interface Props {
  navigation: MobileMoneyPaymentScreenNavigationProp;
  route: MobileMoneyPaymentScreenRouteProp;
}

interface MobileMoneyProvider {
  code: string;
  name: string;
  icon?: string;
}

const MobileMoneyPaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<MobileMoneyProvider[]>([]);

  const dispatch = useDispatch<AppDispatch>();
  const { orderId, amount } = route.params;

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await paymentService.getMobileMoneyProviders();
      if (response.enabled) {
        setProviders(response.providers);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      Alert.alert('Error', 'Failed to load mobile money providers');
    }
  };

  const handlePayment = async () => {
    if (!selectedProvider) {
      Alert.alert('Error', 'Please select a mobile money provider');
      return;
    }

    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);

    try {
      const paymentData = {
        orderId,
        amount,
        provider: selectedProvider,
        phoneNumber,
      };

      const response = await paymentService.processMobileMoneyPayment(paymentData);

      if (response.success) {
        Alert.alert(
          'Payment Initiated',
          'Please check your phone for payment confirmation',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OrderTracking', { orderId }),
            },
          ]
        );
      } else {
        Alert.alert('Payment Failed', response.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProviderCard = (provider: MobileMoneyProvider) => (
    <TouchableOpacity
      key={provider.code}
      style={[
        styles.providerCard,
        selectedProvider === provider.code && styles.selectedProviderCard,
      ]}
      onPress={() => setSelectedProvider(provider.code)}
    >
      <View style={styles.providerInfo}>
        <View style={styles.providerIcon}>
          <Feather name="smartphone" size={24} color="#4A80F0" />
        </View>
        <Text style={styles.providerName}>{provider.name}</Text>
      </View>
      {selectedProvider === provider.code && (
        <Feather name="check-circle" size={24} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Mobile Money Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>${amount}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Provider</Text>
          {providers.map(renderProviderCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone Number</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Payment Instructions</Text>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={16} color="#10B981" />
            <Text style={styles.instructionText}>
              You will receive a payment prompt on your phone
            </Text>
          </View>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={16} color="#10B981" />
            <Text style={styles.instructionText}>
              Enter your mobile money PIN to confirm
            </Text>
          </View>
          <View style={styles.instruction}>
            <Feather name="check-circle" size={16} color="#10B981" />
            <Text style={styles.instructionText}>
              You will receive a confirmation SMS
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedProvider || !phoneNumber || isLoading) && styles.disabledButton,
          ]}
          onPress={handlePayment}
          disabled={!selectedProvider || !phoneNumber || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>Pay ${amount}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  amountContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  selectedProviderCard: {
    borderColor: '#4A80F0',
    backgroundColor: '#EFF6FF',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  phoneInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  bottomBar: {
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

export default MobileMoneyPaymentScreen;