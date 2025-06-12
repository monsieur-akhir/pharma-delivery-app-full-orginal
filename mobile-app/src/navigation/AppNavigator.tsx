import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import MedicineSearchScreen from '../screens/MedicineSearchScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import AuthScreen from '../screens/AuthScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import PaymentScreen from '../screens/PaymentScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import MedicationRemindersScreen from '../screens/MedicationRemindersScreen';
import VideoConsultationScreen from '../screens/VideoConsultationScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  OTP: { phoneNumber: string };
  Main: undefined;
};

export type MainStackParamList = {
  HomeTabs: undefined;
  PharmacyDetail: { pharmacyId: string };
  MedicineDetail: { medicineId: string };
  Cart: undefined;
  Checkout: undefined;
  ScanPrescription: undefined;
  PrescriptionDetail: { prescriptionId: string };
  VideoConsultation: { pharmacistId?: string };
  Chat: { orderId?: string; pharmacistId?: string };
  TrackOrder: { orderId: string };
  Payment: { orderId: string; amount: number };
  PaymentMethods: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OTP: { phoneNumber: string };
};

const Stack = createStackNavigator<RootStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();

const MainStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
    <MainStack.Screen name="Payment" component={PaymentScreen} />
    <MainStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    <MainStack.Screen name="Notifications" component={NotificationsScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
  </MainStack.Navigator>
);

const OrdersStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="OrdersMain" component={OrdersScreen} />
  </MainStack.Navigator>
);

const PharmaciesStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="PharmaciesMain" component={PharmaciesScreen} />
  </MainStack.Navigator>
);

const RemindersStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="RemindersMain" component={MedicationRemindersScreen} />
  </MainStack.Navigator>
);

const ProfileStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="ProfileMain" component={SettingsScreen} />
  </MainStack.Navigator>
);

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }: { route: any }) => ({
      tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Pharmacies') {
          iconName = focused ? 'medical' : 'medical-outline';
        } else if (route.name === 'Orders') {
          iconName = focused ? 'receipt' : 'receipt-outline';
        } else if (route.name === 'Reminders') {
          iconName = focused ? 'alarm' : 'alarm-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'ellipse';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#0C6B58',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Pharmacies" component={PharmaciesStackNavigator} />
    <Tab.Screen name="Orders" component={OrdersStackNavigator} />
    <Tab.Screen name="Reminders" component={RemindersStackNavigator} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

const AuthStackNavigator = () => (
  <AuthStack.Navigator>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="OTP" component={OtpVerificationScreen} />
  </AuthStack.Navigator>
);

const AppNavigator = () => {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainStackNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;