
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelect: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
}) => {
  const paymentMethods = [
    {
      id: 'CARD',
      name: 'Carte bancaire',
      icon: 'credit-card',
      description: 'Visa, Mastercard, American Express',
    },
    {
      id: 'MOBILE_MONEY',
      name: 'Mobile Money',
      icon: 'phone-android',
      description: 'Orange Money, MTN Money, Moov Money',
    },
    {
      id: 'CASH',
      name: 'Espèces à la livraison',
      icon: 'payments',
      description: 'Payez en espèces lors de la livraison',
    },
  ];

  return (
    <View style={styles.container}>
      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.methodCard,
            selectedMethod === method.id && styles.selectedCard,
          ]}
          onPress={() => onSelect(method.id)}
        >
          <View style={styles.methodContent}>
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={method.icon as any}
                size={24}
                color={selectedMethod === method.id ? '#4A80F0' : '#64748B'}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[
                styles.methodName,
                selectedMethod === method.id && styles.selectedText,
              ]}>
                {method.name}
              </Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
          </View>
          {selectedMethod === method.id && (
            <MaterialIcons name="check-circle" size={20} color="#4A80F0" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: '#4A80F0',
    backgroundColor: '#F0F7FF',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  selectedText: {
    color: '#4A80F0',
  },
  methodDescription: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default PaymentMethodSelector;
