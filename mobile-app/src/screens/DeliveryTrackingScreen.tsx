import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const DeliveryTrackingScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.title}>Track Delivery</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.mapContainer}>
          <Text style={styles.mapPlaceholder}>Map View</Text>
        </View>
        
        <View style={styles.deliveryInfo}>
          <Text style={styles.orderNumber}>Order #12345</Text>
          <Text style={styles.status}>On the way</Text>
          <Text style={styles.eta}>Estimated arrival: 15 minutes</Text>
        </View>
      </View>
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
  mapContainer: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapPlaceholder: {
    fontSize: 16,
    color: '#666',
  },
  deliveryInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: '#0C6B58',
    fontWeight: '600',
    marginBottom: 5,
  },
  eta: {
    fontSize: 14,
    color: '#666',
  },
});

export default DeliveryTrackingScreen;