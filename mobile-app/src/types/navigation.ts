import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type MainStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  OTP: { phone: string; userType: 'customer' | 'deliverer' };
  MainTabs: undefined;
  MedicineDetail: { medicineId: string };
  MedicineSearch: undefined;
  Cart: undefined;
  Checkout: { items: any[] };
  Payment: { orderId: string; amount: number };
  CardPayment: { orderId: string; amount: number };
  MobileMoneyPayment: { orderId: string; amount: number };
  OrderDetails: { orderId: string };
  TrackOrder: { orderId: string };
  PrescriptionDetail: { prescriptionId: string };
  ScanPrescription: undefined;
  PrescriptionUpload: { orderId?: string };
  PharmacyDetail: { pharmacyId: string };
  MedicationDetails: { scheduleId: string };
  VideoChat: { pharmacistId?: string; orderId?: string; roomId?: string };
  RateOrder: { orderId: string };
  Support: { orderId: string };
  AddPaymentMethod: undefined;
  PaymentMethods: undefined;
  MedicationReminders: undefined;
  DeliveryDashboard: undefined;
  DeliveryDetail: { deliveryId: string };
  ActiveDelivery: { deliveryId: string };
  PharmacyMap: { latitude?: number; longitude?: number };
};

export type TabParamList = {
  Home: undefined;
  Pharmacies: undefined;
  PharmacyMap: { latitude?: number; longitude?: number };
  Orders: undefined;
  Reminders: undefined;
  Profile: undefined;
  MedicineSearch: undefined;
  Cart: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  OTP: { phone: string; userType: 'customer' | 'deliverer' };
  Onboarding: undefined;
  OtpVerification: { phone: string; userType: 'customer' | 'deliverer' };
};

export type RootParamList = {
  Auth: undefined;
  MainTabs: undefined;
  VideoChat: {
    pharmacistId?: string;
    orderId?: string;
    roomId?: string;
  };
  OrderDetails: { orderId: string };
  TrackOrder: { orderId: string };
  PrescriptionDetail: { prescriptionId: string };
  MedicationReminders: undefined;
  OrderTracking: { orderId: string };
  Support: { orderId: string };
  RateOrder: { orderId: string };
  Checkout: { medicineId: string; quantity: number };
  PharmacyDetail: { pharmacyId: string };
  Pharmacies: undefined;
  AddPaymentMethod: undefined;
  MobileMoneyPayment: { orderId: string; amount: number; transactionReference?: string };
  CardPayment: { orderId: string; amount: number };
  OtpVerification: { phone: string; userType: 'customer' | 'deliverer' };
};

// Navigation prop types
import { NavigationProp } from '@react-navigation/native';

export type MainStackNavigationProp = NavigationProp<MainStackParamList>;
export type TabNavigationProp = NavigationProp<TabParamList>;
export type AuthStackNavigationProp = NavigationProp<AuthStackParamList>;

export type RootStackScreenProps<Screen extends keyof RootParamList> =
  StackScreenProps<RootParamList, Screen>;

export type MainStackScreenProps<Screen extends keyof MainStackParamList> =
  StackScreenProps<MainStackParamList, Screen>;

export type AuthStackScreenProps<Screen extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, Screen>;

export type TabScreenProps<Screen extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, Screen>;