import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Screens imports
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import MedicationRemindersScreen from '../screens/MedicationRemindersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MedicineDetailScreen from '../screens/MedicineDetailScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import VideoChatScreen from '../features/video-chat/VideoChatScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';
import PrescriptionUploadScreen from '../screens/PrescriptionUploadScreen';
import PharmacyMapScreen from '../screens/PharmacyMapScreen';

// Types
import { 
  RootStackParamList, 
  MainStackParamList, 
  MainTabParamList 
} from '../types/navigation';

const RootStack = createStackNavigator<RootStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

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
    <MainStack.Screen name="Orders" component={OrdersScreen} />
  </MainStack.Navigator>
);

const PharmaciesStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="Pharmacies" component={PharmaciesScreen} />
  </MainStack.Navigator>
);

const RemindersStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="Reminders" component={MedicationRemindersScreen} />
  </MainStack.Navigator>
);

const ProfileStackNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="Profile" component={SettingsScreen} />
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