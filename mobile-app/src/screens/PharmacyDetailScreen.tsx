import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const PharmacyDetailScreen = ({ navigation, route }: any) => {
  const { pharmacy } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0C6B58" />
        </TouchableOpacity>
        <Text style={styles.title}>Pharmacy Details</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <MaterialIcons name="favorite-border" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.pharmacyCard}>
          <View style={styles.pharmacyHeader}>
            <View style={styles.pharmacyIcon}>
              <FontAwesome5 name="clinic-medical" size={24} color="#0C6B58" />
            </View>
            <View style={styles.pharmacyInfo}>
              <Text style={styles.pharmacyName}>{pharmacy?.name || 'Pharmacy Name'}</Text>
              <Text style={styles.pharmacyAddress}>{pharmacy?.address || 'Pharmacy Address'}</Text>
              <View style={styles.rating}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{pharmacy?.rating || '4.5'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="call" size={20} color="#0C6B58" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="directions" size={20} color="#0C6B58" />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="schedule" size={20} color="#0C6B58" />
              <Text style={styles.actionText}>Hours</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Services</Text>
          <View style={styles.servicesList}>
            <View style={styles.serviceItem}>
              <MaterialIcons name="local-pharmacy" size={20} color="#0C6B58" />
              <Text style={styles.serviceText}>Prescription Filling</Text>
            </View>
            <View style={styles.serviceItem}>
              <MaterialIcons name="local-shipping" size={20} color="#0C6B58" />
              <Text style={styles.serviceText}>Home Delivery</Text>
            </View>
            <View style={styles.serviceItem}>
              <MaterialIcons name="video-call" size={20} color="#0C6B58" />
              <Text style={styles.serviceText}>Consultation</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.orderButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.orderButtonText}>Order from this Pharmacy</Text>
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
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pharmacyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pharmacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pharmacyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f7f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#0C6B58',
    marginTop: 5,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
  servicesList: {
    gap: 15,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  orderButton: {
    backgroundColor: '#0C6B58',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PharmacyDetailScreen;