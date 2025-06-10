import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: string;
  type: string;
}

type PaymentStackParamList = {
  PaymentMethod: { orderId: number; amount: number };
  CardPayment: { orderId: number; amount: number };
  MobileMoneyPayment: { orderId: number; amount: number };
};

const PaymentMethodScreen = () => {
  const navigation = useNavigation<NavigationProp<PaymentStackParamList>>();
  const route = useRoute();
  const { orderId, amount } = route.params as { orderId: number; amount: number };
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption | null>(null);

  // Payment options
  const paymentOptions: PaymentMethodOption[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'card-outline',
      type: 'CARD',
    },
    {
      id: 'mobile-money',
      name: 'Mobile Money',
      icon: 'phone-portrait-outline',
      type: 'MOBILE_MONEY',
    },
  ];

  // Handle payment option selection
  const handleSelectMethod = (method: PaymentMethodOption | null) => {
    setSelectedMethod(method);
  };

  // Continue to payment
  const handleContinue = () => {
    if (selectedMethod?.type === 'CARD') {
      navigation.navigate('CardPayment', { orderId, amount });
    } else if (selectedMethod?.type === 'MOBILE_MONEY') {
      navigation.navigate('MobileMoneyPayment', { orderId, amount });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Payment Method</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {paymentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.paymentOption,
                selectedMethod?.id === option.id && styles.selectedOption,
              ]}
              onPress={() => handleSelectMethod(option)}
            >
              <View style={styles.optionLeftContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name={option.icon as any} size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.optionText}>{option.name}</Text>
              </View>
              {selectedMethod?.id === option.id && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order ID:</Text>
            <Text style={styles.summaryValue}>{orderId}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>{amount.toLocaleString()} XOF</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedMethod && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedMethod}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
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
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionsContainer: {
    marginBottom: SIZES.padding * 2,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.accent,
  },
  optionLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  optionText: {
    fontSize: SIZES.font,
    fontWeight: '500',
    color: COLORS.text,
  },
  orderSummary: {
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding * 2,
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
    marginVertical: 5,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: SIZES.font,
  },
  summaryValue: {
    fontWeight: 'bold',
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  footer: {
    paddingVertical: SIZES.padding,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: COLORS.surface,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
});

export default PaymentMethodScreen;