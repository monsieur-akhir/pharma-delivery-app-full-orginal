import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screen components
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import PharmacyMapScreen from '../screens/PharmacyMapScreen';
import MedicineSearchScreen from '../screens/MedicineSearchScreen';
import CartScreen from '../screens/CartScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentMethodScreen from '../screens/PaymentMethodScreen';
import CardPaymentScreen from '../screens/CardPaymentScreen';
import MobileMoneyPaymentScreen from '../screens/MobileMoneyPaymentScreen';
import PrescriptionUploadScreen from '../screens/PrescriptionUploadScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import DeliveryTrackingScreen from '../screens/DeliveryTrackingScreen';
import MedicationRemindersScreen from '../screens/MedicationRemindersScreen';
import MedicationDetailsScreen from '../screens/MedicationDetailsScreen';
import AddPaymentMethodScreen from '../screens/AddPaymentMethodScreen';
import DeliveryDashboardScreen from '../screens/DeliveryDashboardScreen';
import DeliveryDetailsScreen from '../screens/DeliveryDetailsScreen';
import DeliveryHistoryScreen from '../screens/DeliveryHistoryScreen';
import DeliveryEarningsScreen from '../screens/DeliveryEarningsScreen';

// Create navigators
const Stack = createStackNavigator();
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
    <Stack.Screen
          name="AddPaymentMethod"
          component={AddPaymentMethodScreen}
          options={{ title: 'Ajouter un mode de paiement' }}
        />
        <Stack.Screen
          name="DeliveryDashboard"
          component={DeliveryDashboardScreen}
          options={{ title: 'Tableau de bord coursier' }}
        />
        <Stack.Screen
          name="DeliveryDetails"
          component={DeliveryDetailsScreen}
          options={{ title: 'Détails de la livraison' }}
        />
        <Stack.Screen
          name="DeliveryHistory"
          component={DeliveryHistoryScreen}
          options={{ title: 'Historique des livraisons' }}
        />
        <Stack.Screen
          name="DeliveryEarnings"
          component={DeliveryEarningsScreen}
          options={{ title: 'Mes gains' }}
        />
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
        let iconName;

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
          <Stack.Screen name="OTP" component={OtpScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
       <Stack.Screen 
          name="OrderTracking" 
          component={DeliveryTrackingScreen} 
          options={{ title: 'Track Order' }} 
        />
        <Stack.Screen 
          name="MobileMoneyPayment" 
          component={MobileMoneyPaymentScreen} 
          options={{ title: 'Mobile Money Payment' }} 
        />
        <Stack.Screen 
          name="OrderDetails" 
          component={OrderDetailsScreen} 
          options={{ title: 'Order Details' }} 
        />
        <Stack.Screen 
          name="MedicationDetails" 
          component={MedicationDetailsScreen} 
          options={{ title: 'Medication Details' }} 
        />
        <Stack.Screen 
          name="MedicationReminders" 
          component={MedicationRemindersScreen} 
          options={{ title: 'Medication Reminders' }} 
        />
    </Stack.Navigator>
  );
};

export default AppNavigator;