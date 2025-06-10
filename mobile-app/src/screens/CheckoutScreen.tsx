import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CheckoutScreen = ({ navigation }: any) => {
  const [selectedPayment, setSelectedPayment] = useState('card');

  const paymentMethods = [
    { id: 'card', name: 'Credit Card', icon: 'credit-card' },
    { id: 'mobile', name: 'Mobile Money', icon: 'phone-android' },
    { id: 'cash', name: 'Cash on Delivery', icon: 'money' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <MaterialIcons name="location-on" size={20} color="#0C6B58" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressText}>123 Main Street</Text>
              <Text style={styles.addressSubtext}>Dakar, Senegal</Text>
            </View>
            <TouchableOpacity>
              <MaterialIcons name="edit" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderCard}>
            <View style={styles.orderItem}>
              <Text style={styles.itemName}>Amoxicillin 250mg</Text>
              <Text style={styles.itemPrice}>$12.99</Text>
            </View>
            <View style={styles.orderItem}>
              <Text style={styles.itemName}>Ibuprofen 400mg</Text>
              <Text style={styles.itemPrice}>$8.99</Text>
            </View>
            <View style={styles.orderItem}>
              <Text style={styles.itemName}>Delivery Fee</Text>
              <Text style={styles.itemPrice}>$4.01</Text>
            </View>
            <View style={[styles.orderItem, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>$25.99</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                selectedPayment === method.id && styles.selectedPayment
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <MaterialIcons name={method.icon as any} size={24} color="#0C6B58" />
              <Text style={styles.paymentText}>{method.name}</Text>
              <MaterialIcons 
                name={selectedPayment === method.id ? 'radio-button-checked' : 'radio-button-unchecked'} 
                size={24} 
                color="#0C6B58" 
              />
            </TouchableOpacity>
          ))}
        </View>
        
        {selectedPayment === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="MM/YY"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="CVV"
                keyboardType="numeric"
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Cardholder Name"
            />
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.placeOrderButton}
          onPress={() => navigation.navigate('OrderConfirmation')}
        >
          <Text style={styles.placeOrderText}>Place Order - $25.99</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 15,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  addressSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 18,
    color: '#0C6B58',
    fontWeight: 'bold',
  },
  paymentOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedPayment: {
    borderWidth: 2,
    borderColor: '#0C6B58',
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  placeOrderButton: {
    backgroundColor: '#0C6B58',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;