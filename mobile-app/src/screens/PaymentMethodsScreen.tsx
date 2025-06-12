
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { COLORS, SIZES } from '../constants';

interface PaymentMethod {
  id: number;
  type: 'CARD' | 'MOBILE_MONEY';
  provider?: string;
  lastFourDigits?: string;
  phoneNumber?: string;
  isDefault: boolean;
  createdAt: string;
}

const PaymentMethodsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/payments/methods');
      
      if (response.data.status === 'success') {
        setPaymentMethods(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (methodId: number) => {
    try {
      const response = await api.put(`/api/payments/methods/${methodId}/default`);
      
      if (response.data.status === 'success') {
        setPaymentMethods(prev =>
          prev.map(method => ({
            ...method,
            isDefault: method.id === methodId
          }))
        );
        Alert.alert('Success', 'Default payment method updated');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update default method');
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'Failed to update default method');
    }
  };

  const handleDeleteMethod = async (methodId: number) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(methodId);
              const response = await api.delete(`/api/payments/methods/${methodId}`);
              
              if (response.data.status === 'success') {
                setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
                Alert.alert('Success', 'Payment method deleted');
              } else {
                Alert.alert('Error', response.data.message || 'Failed to delete payment method');
              }
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'Failed to delete payment method');
            } finally {
              setIsDeleting(null);
            }
          }
        }
      ]
    );
  };

  const getPaymentMethodIcon = (type: string, provider?: string) => {
    if (type === 'CARD') {
      return 'card-outline';
    } else if (type === 'MOBILE_MONEY') {
      switch (provider) {
        case 'MTN':
          return 'phone-portrait-outline';
        case 'ORANGE':
          return 'phone-portrait-outline';
        case 'MOOV':
          return 'phone-portrait-outline';
        default:
          return 'phone-portrait-outline';
      }
    }
    return 'wallet-outline';
  };

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'CARD') {
      return `**** **** **** ${method.lastFourDigits}`;
    } else if (method.type === 'MOBILE_MONEY') {
      return `${method.provider} - ${method.phoneNumber}`;
    }
    return 'Unknown';
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.paymentMethodCard}>
      <View style={styles.methodInfo}>
        <View style={styles.methodHeader}>
          <View style={styles.iconContainer}>
            <Icon 
              name={getPaymentMethodIcon(method.type, method.provider)} 
              size={24} 
              color={COLORS.primary} 
            />
          </View>
          <View style={styles.methodDetails}>
            <Text style={styles.methodType}>
              {method.type === 'CARD' ? 'Credit/Debit Card' : `${method.provider} Mobile Money`}
            </Text>
            <Text style={styles.methodDisplay}>
              {getPaymentMethodDisplay(method)}
            </Text>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.methodActions}>
          {!method.isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(method.id)}
            >
              <Text style={styles.actionButtonText}>Set Default</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteMethod(method.id)}
            disabled={isDeleting === method.id}
          >
            {isDeleting === method.id ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="trash-outline" size={16} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPaymentMethod')}
        >
          <Icon name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {paymentMethods.length > 0 ? (
          <View style={styles.methodsList}>
            <Text style={styles.sectionTitle}>Your Payment Methods</Text>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="wallet-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Payment Methods</Text>
            <Text style={styles.emptyMessage}>
              Add a payment method to make purchases faster and easier
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => navigation.navigate('AddPaymentMethod')}
            >
              <Text style={styles.addFirstButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Security Information</Text>
          <View style={styles.infoItem}>
            <Icon name="shield-checkmark-outline" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              All payment information is encrypted and securely stored
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="lock-closed-outline" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              We never store your full card details or PIN
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="checkmark-circle-outline" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              PCI DSS compliant payment processing
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SIZES.base,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    padding: SIZES.base,
  },
  scrollView: {
    flex: 1,
    padding: SIZES.padding,
  },
  methodsList: {
    marginBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  paymentMethodCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  methodDetails: {
    flex: 1,
  },
  methodType: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  methodDisplay: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: 4,
  },
  defaultBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  defaultText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: '500',
  },
  methodActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.base,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    minWidth: 40,
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
  addFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  addFirstButtonText: {
    color: COLORS.white,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: COLORS.lightGray2,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
  },
  infoTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  infoText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    marginLeft: SIZES.base,
    flex: 1,
  },
});

export default PaymentMethodsScreen;
