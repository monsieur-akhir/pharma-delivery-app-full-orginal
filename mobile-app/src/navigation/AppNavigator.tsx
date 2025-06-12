
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList, MainStackParamList, AuthStackParamList, TabParamList } from '../types/navigation';
import { RootState } from '../store';

// Screens
import HomeScreen from '../screens/HomeScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import MedicineDetailScreen from '../screens/MedicineDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import AddPaymentMethodScreen from '../screens/AddPaymentMethodScreen';
import CardPaymentScreen from '../screens/CardPaymentScreen';
import MobileMoneyPaymentScreen from '../screens/MobileMoneyPaymentScreen';
import PaymentScreen from '../screens/PaymentScreen';
import MedicationRemindersScreen from '../screens/MedicationRemindersScreen';
import MedicationDetailsScreen from '../screens/MedicationDetailsScreen';
import VideoChatScreen from '../features/video-chat/VideoChatScreen';
import PharmacyMapScreen from '../screens/PharmacyMapScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';

const RootStack = createStackNavigator<RootStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
    <MainStack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
    <MainStack.Screen name="Payment" component={PaymentScreen} />
    <MainStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    <MainStack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
    <MainStack.Screen name="Notifications" component={NotificationsScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
    <MainStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    <MainStack.Screen name="CardPayment" component={CardPaymentScreen} />
    <MainStack.Screen name="MobileMoneyPayment" component={MobileMoneyPaymentScreen} />
    <MainStack.Screen name="MedicationReminders" component={MedicationRemindersScreen} />
    <MainStack.Screen name="VideoChat" component={VideoChatScreen} />
    <MainStack.Screen name="TrackOrder" component={TrackOrderScreen} />
  </MainStack.Navigator>
);

const PharmaciesStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="PharmaciesList" component={PharmaciesScreen} />
    <MainStack.Screen name="PharmacyMap" component={PharmacyMapScreen} />
  </MainStack.Navigator>
);

const OrdersStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="OrdersList" component={OrdersScreen} />
    <MainStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
  </MainStack.Navigator>
);

const RemindersStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="RemindersList" component={MedicationRemindersScreen} />
    <MainStack.Screen name="MedicationDetails" component={MedicationDetailsScreen} />
  </MainStack.Navigator>
);

const ProfileStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="ProfileMain" component={SettingsScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
    <MainStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
  </MainStack.Navigator>
);

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Pharmacies') {
          iconName = focused ? 'medical' : 'medical-outline';
        } else if (route.name === 'Orders') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'Reminders') {
          iconName = focused ? 'alarm' : 'alarm-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'home-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
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
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainStackNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
