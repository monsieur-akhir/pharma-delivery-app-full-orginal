import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStackParamList } from './types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import screen components
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import HomeScreen from '../screens/HomeScreen';
import PharmaciesScreen from '@/screens/PharmaciesScreen';
import PharmacyDetailScreen from '../screens/PharmacyDetailScreen';
import MedicineDetailScreen from '@/screens/MedicineDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '@/screens/OrdersScreen';
import OrderDetailScreen from '@/screens/OrderDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrescriptionsScreen from '@/screens/PrescriptionsScreen';
import PrescriptionDetailScreen from '@/screens/PrescriptionDetailScreen';
import ScanPrescriptionScreen from '@/screens/ScanPrescriptionScreen';
import RemindersScreen from '@/screens/RemindersScreen';
import AddReminderScreen from '@/screens/AddReminderScreen';
import VideoConsultationScreen from '@/screens/VideoConsultationScreen';
import ChatScreen from '@/screens/ChatScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import PaymentMethodsScreen from '@/screens/PaymentMethodsScreen';
import AddPaymentMethodScreen from '@/screens/AddPaymentMethodScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';

// Create navigators
const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator();

// Home tab stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="PharmacyDetail" component={PharmacyDetailScreen} />
    <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
    <Stack.Screen name="Cart" component={CartScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="ScanPrescription" component={ScanPrescriptionScreen} />
    <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
    <Stack.Screen name="VideoConsultation" component={VideoConsultationScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
  </Stack.Navigator>
);

// Orders tab stack
const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersMain" component={OrdersScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

// Pharmacy tab stack
const PharmaciesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PharmaciesMain" component={PharmaciesScreen} />
    <Stack.Screen name="PharmacyDetail" component={PharmacyDetailScreen} />
    <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
  </Stack.Navigator>
);

// Reminders tab stack
const RemindersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RemindersMain" component={RemindersScreen} />
    <Stack.Screen name="AddReminder" component={AddReminderScreen} />
  </Stack.Navigator>
);

// Profile tab stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} />
    <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
    <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

// Main tab navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap | undefined;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Orders') {
          iconName = focused ? 'receipt' : 'receipt-outline';
        } else if (route.name === 'Pharmacies') {
          iconName = focused ? 'medkit' : 'medkit-outline';
        } else if (route.name === 'Reminders') {
          iconName = focused ? 'alarm' : 'alarm-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#667eea',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} />
    <Tab.Screen name="Pharmacies" component={PharmaciesStack} />
    <Tab.Screen name="Orders" component={OrdersStack} />
    <Tab.Screen name="Reminders" component={RemindersStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Define MainStackParamList type
export type MainStackParamList = {
  MainTabs: undefined;
  PharmacyMap: { latitude: number; longitude: number };
  MedicineSearch: undefined;
  PrescriptionUpload: { orderId?: string };
  // Add other routes as needed
};

// Root navigator
const AppNavigator = () => {
  const isAuthenticated = useSelector((state: RootState) => !!state.auth.token);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  // Check if user has seen welcome screen
  useEffect(() => {
    async function checkWelcomeStatus() {
      try {
        const value = await AsyncStorage.getItem('@has_seen_welcome');
        setHasSeenWelcome(value === 'true');
      } catch (error) {
        console.error('Error reading welcome status:', error);
        setHasSeenWelcome(false);
      }
    }
    
    checkWelcomeStatus();
  }, []);

  // Show loading state while checking welcome screen status
  if (hasSeenWelcome === null) {
    return null; // Or a loading spinner
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasSeenWelcome ? (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      ) : !isAuthenticated ? (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="OTP" component={OtpScreen as React.ComponentType<any>} />
        </>
      ) : (
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;