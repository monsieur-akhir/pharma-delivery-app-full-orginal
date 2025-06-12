
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  MainTabs: undefined;
  VideoChat: {
    pharmacistId?: string;
    orderId?: string;
    roomId?: string;
  };
  OrderDetails: { orderId: string };
  OrderTracking: { orderId: string };
  TrackOrder: { orderId: string };
  Payment: { orderId: string; amount: number };
  CardPayment: { orderId: string; amount: number };
  MobileMoneyPayment: { 
    orderId: string; 
    amount: number; 
    transactionReference?: string;
  };
  PaymentMethod: { orderId: string; amount: number };
  Checkout: { items: any[] };
  PharmacyDetail: { pharmacyId: string };
  PrescriptionDetail: { prescriptionId: string };
  RateOrder: { orderId: string };
  Support: { orderId: string };
  MedicationReminders: undefined;
  AddPaymentMethod: undefined;
  Pharmacies: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  OTP: { phone: string; userType: 'customer' | 'deliverer' };
  OtpVerification: { phone: string; userType: 'customer' | 'deliverer' };
};

export type TabParamList = {
  Home: undefined;
  Medicine: undefined;
  Orders: undefined;
  Prescriptions: undefined;
  Profile: undefined;
  PharmacyMap: { 
    latitude?: number; 
    longitude?: number; 
  };
  Cart: undefined;
  Notifications: undefined;
  Reminders: undefined;
  Settings: undefined;
  PaymentMethods: undefined;
  Chat: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  MedicineDetail: { medicineId: string };
  PharmacyDetail: { pharmacyId: string };
  ScanPrescription: undefined;
  PrescriptionUpload: { orderId?: string };
  MedicineSearch: undefined;
  VideoConsultation: undefined;
};

export type OrderStackParamList = {
  OrdersList: undefined;
  OrderDetails: { orderId: string };
  TrackOrder: { orderId: string };
  Payment: { orderId: string; amount: number };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  Settings: undefined;
  PaymentMethods: undefined;
  MedicationReminders: undefined;
  NotificationSettings: undefined;
};

export type RootNavigationProp = StackNavigationProp<RootStackParamList>;
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

export type CompositeNavProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export type AuthScreenRouteProp = RouteProp<AuthStackParamList, 'Auth'>;
export type OTPScreenRouteProp = RouteProp<AuthStackParamList, 'OTP'>;
export type HomeScreenRouteProp = RouteProp<TabParamList, 'Home'>;
