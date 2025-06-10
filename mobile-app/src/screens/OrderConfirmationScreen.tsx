import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const OrderConfirmationScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.navigate('Main')}
        >
          <MaterialIcons name="close" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Confirmed</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.successIcon}>
          <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
        </View>
        
        <Text style={styles.successTitle}>Order Placed Successfully!</Text>
        <Text style={styles.successMessage}>
          Your order has been confirmed and will be delivered soon.
        </Text>
        
        <View style={styles.orderDetails}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Number:</Text>
            <Text style={styles.detailValue}>#12345</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Delivery:</Text>
            <Text style={styles.detailValue}>30-45 minutes</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount:</Text>
            <Text style={styles.detailValue}>$25.99</Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => navigation.navigate('DeliveryTracking')}
          >
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
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
  closeButton: {
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
    alignItems: 'center',
  },
  successIcon: {
    marginVertical: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  orderDetails: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 15,
  },
  trackButton: {
    backgroundColor: '#0C6B58',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0C6B58',
  },
  homeButtonText: {
    color: '#0C6B58',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderConfirmationScreen;