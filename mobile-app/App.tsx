import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { 
  useFonts, 
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MedicationsScreen from './src/screens/MedicationsScreen';
import PrescriptionScreen from './src/screens/PrescriptionScreen';
import DeliveryTrackingScreen from './src/screens/DeliveryTrackingScreen';
import PharmacyListScreen from './src/screens/PharmacyListScreen';
import PharmacyDetailScreen from './src/screens/PharmacyDetailScreen';
import OrderConfirmationScreen from './src/screens/OrderConfirmationScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <MaterialIcons name="home" size={size} color={color} />;
          } else if (route.name === 'Medications') {
            return <FontAwesome5 name="pills" size={size} color={color} />;
          } else if (route.name === 'Prescriptions') {
            return <FontAwesome5 name="file-medical" size={size} color={color} />;
          } else if (route.name === 'Profile') {
            return <MaterialIcons name="person" size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#0C6B58',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Medications" component={MedicationsScreen} />
      <Tab.Screen name="Prescriptions" component={PrescriptionScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="PharmacyList" component={PharmacyListScreen} />
            <Stack.Screen name="PharmacyDetail" component={PharmacyDetailScreen} />
            <Stack.Screen name="DeliveryTracking" component={DeliveryTrackingScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // Artificially delay for demonstration purposes
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}