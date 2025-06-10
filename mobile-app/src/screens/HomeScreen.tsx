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

const HomeScreen = ({ navigation }: any) => {
  const quickActions = [
    {
      id: 1,
      title: 'Order Medications',
      icon: 'local-pharmacy',
      color: '#0C6B58',
      onPress: () => navigation.navigate('PharmacyList'),
    },
    {
      id: 2,
      title: 'Upload Prescription',
      icon: 'camera-alt',
      color: '#FF6B6B',
      onPress: () => navigation.navigate('Prescriptions'),
    },
    {
      id: 3,
      title: 'Track Delivery',
      icon: 'local-shipping',
      color: '#4ECDC4',
      onPress: () => navigation.navigate('DeliveryTracking'),
    },
    {
      id: 4,
      title: 'Video Consultation',
      icon: 'video-call',
      color: '#45B7D1',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.subtitle}>How can we help you today?</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications" size={24} color="#0C6B58" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { borderLeftColor: action.color }]}
                onPress={action.onPress}
              >
                <MaterialIcons name={action.icon as any} size={32} color={action.color} />
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.recentOrders}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <FontAwesome5 name="pills" size={20} color="#0C6B58" />
              <Text style={styles.orderTitle}>Order #12345</Text>
              <Text style={styles.orderStatus}>Delivered</Text>
            </View>
            <Text style={styles.orderDate}>Delivered on Jan 15, 2024</Text>
            <Text style={styles.orderItems}>Amoxicillin 250mg, Ibuprofen 400mg</Text>
          </View>
        </View>
        
        <View style={styles.reminders}>
          <Text style={styles.sectionTitle}>Medication Reminders</Text>
          <View style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <FontAwesome5 name="clock" size={16} color="#FF6B6B" />
            </View>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderTitle}>Take Amoxicillin</Text>
              <Text style={styles.reminderTime}>Next dose at 2:00 PM</Text>
            </View>
            <TouchableOpacity style={styles.reminderButton}>
              <Text style={styles.reminderButtonText}>Mark Taken</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#0C6B58',
    padding: 20,
    paddingTop: 40,
    position: 'relative',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e6f7f4',
    marginTop: 5,
  },
  notificationButton: {
    position: 'absolute',
    top: 40,
    right: 20,
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
  quickActions: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  recentOrders: {
    marginBottom: 30,
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
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  orderStatus: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  orderItems: {
    fontSize: 14,
    color: '#333',
  },
  reminders: {
    marginBottom: 30,
  },
  reminderCard: {
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
  reminderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffe6e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reminderTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  reminderButton: {
    backgroundColor: '#0C6B58',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reminderButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;