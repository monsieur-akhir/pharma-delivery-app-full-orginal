
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Import types
import { MainStackParamList, TabParamList, AuthStackParamList } from '../types/navigation';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import PharmacyMapScreen from '../screens/PharmacyMapScreen';
import OrdersScreen from '../screens/OrdersScreen';
import MedicationRemindersScreen from '../screens/MedicationRemindersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MedicineDetailScreen from '../screens/MedicineDetailScreen';
import MedicineSearchScreen from '../screens/MedicineSearchScreen';
import CartScreen from '../screens/CartScreen';
import PaymentScreen from '../screens/PaymentScreen';
import MobileMoneyPaymentScreen from '../screens/MobileMoneyPaymentScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';
import ScanPrescriptionScreen from '../screens/ScanPrescriptionScreen';
import PrescriptionUploadScreen from '../screens/PrescriptionUploadScreen';
import MedicationDetailsScreen from '../screens/MedicationDetailsScreen';
import VideoChatScreen from '../features/video-chat/VideoChatScreen';
import AddPaymentMethodScreen from '../screens/AddPaymentMethodScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';

const MainStack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

function MainStackNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={TabNavigator} />
      <MainStack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
      <MainStack.Screen name="MedicineSearch" component={MedicineSearchScreen} />
      <MainStack.Screen name="Cart" component={CartScreen} />
      <MainStack.Screen name="Payment" component={PaymentScreen} />
      <MainStack.Screen name="MobileMoneyPayment" component={MobileMoneyPaymentScreen} />
      <MainStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <MainStack.Screen name="TrackOrder" component={TrackOrderScreen} />
      <MainStack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
      <MainStack.Screen name="ScanPrescription" component={ScanPrescriptionScreen} />
      <MainStack.Screen name="PrescriptionUpload" component={PrescriptionUploadScreen} />
      <MainStack.Screen name="MedicationDetails" component={MedicationDetailsScreen} />
      <MainStack.Screen name="VideoChat" component={VideoChatScreen} />
      <MainStack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
      <MainStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    </MainStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Pharmacies':
              iconName = 'local-pharmacy';
              break;
            case 'PharmacyMap':
              iconName = 'map';
              break;
            case 'Orders':
              iconName = 'receipt';
              break;
            case 'Reminders':
              iconName = 'alarm';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0C6B58',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pharmacies" component={PharmaciesScreen} />
      <Tab.Screen name="PharmacyMap" component={PharmacyMapScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Reminders" component={MedicationRemindersScreen} />
      <Tab.Screen name="Profile" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Auth" component={AuthScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="OTP" component={OtpVerificationScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

export type { MainStackParamList, TabParamList, AuthStackParamList };
