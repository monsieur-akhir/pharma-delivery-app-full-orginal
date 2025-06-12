
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PaymentMethod {
  id: string;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description: string;
  enabled: boolean;
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethodId?: string;
  onSelectMethod: (methodId: string) => void;
  onAddPaymentMethod?: () => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods,
  selectedMethodId,
  onSelectMethod,
  onAddPaymentMethod,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Méthode de paiement</Text>
      
      {methods.map((method, index) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.methodCard,
            { marginBottom: index < methods.length - 1 ? 12 : 0 },
            selectedMethodId === method.id && styles.selectedCard,
            !method.enabled && styles.disabledCard,
          ]}
          onPress={() => method.enabled && onSelectMethod(method.id)}
          disabled={!method.enabled}
        >
          <View style={styles.methodIcon}>
            <MaterialIcons
              name={method.icon}
              size={24}
              color={method.enabled ? '#4A80F0' : '#CCC'}
            />
          </View>
          
          <View style={styles.methodInfo}>
            <Text style={[
              styles.methodName,
              !method.enabled && styles.disabledText
            ]}>
              {method.name}
            </Text>
            <Text style={[
              styles.methodDescription,
              !method.enabled && styles.disabledText
            ]}>
              {method.description}
            </Text>
          </View>
          
          <View style={styles.radioContainer}>
            <View style={[
              styles.radioButton,
              selectedMethodId === method.id && styles.radioSelected
            ]}>
              {selectedMethodId === method.id && (
                <View style={styles.radioInner} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
      
      {onAddPaymentMethod && (
        <TouchableOpacity
          style={styles.addMethodButton}
          onPress={onAddPaymentMethod}
        >
          <MaterialIcons name="add" size={24} color="#4A80F0" />
          <Text style={styles.addMethodText}>Ajouter une méthode de paiement</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Removed gap property, using marginBottom instead
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: '#4A80F0',
    backgroundColor: '#F8F9FF',
  },
  disabledCard: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#4A80F0',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A80F0',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#4A80F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 12,
  },
  addMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A80F0',
    marginLeft: 8,
  },
});

export default PaymentMethodSelector;
