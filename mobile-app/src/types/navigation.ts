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
};

export type TabParamList = {
  Home: undefined;
  Pharmacies: undefined;
  PharmacyMap: undefined;
  Orders: undefined;
  Reminders: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  OTP: { phone: string; userType: 'customer' | 'deliverer' };
  Onboarding: undefined;
};

export type RootParamList = MainStackParamList & {
  MainTabs: undefined;
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