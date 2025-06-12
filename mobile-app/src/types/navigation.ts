
import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainStackParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
};

export type MainStackParamList = {
  HomeTabs: NavigatorScreenParams<TabParamList>;
  MedicineDetail: { medicineId: string };
  PharmacyDetail: { pharmacyId: string };
  Payment: { orderId: string; amount: number };
  AddPaymentMethod: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  Settings: undefined;
  OrderDetails: { orderId: string };
  TrackOrder: { orderId: string };
  VideoChat: { roomId: string; pharmacistId?: string };
  PrescriptionDetail: { prescriptionId: string };
  MedicationReminders: undefined;
  Checkout: { items: any[] };
  CardPayment: { orderId: string; amount: number };
  MobileMoneyPayment: { orderId: string; amount: number; transactionReference?: string };
  RateOrder: { orderId: string };
  Support: { orderId: string };
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OTP: { phone: string; userType: 'customer' | 'deliverer' };
  Onboarding: undefined;
};

export type TabParamList = {
  Home: undefined;
  Pharmacies: NavigatorScreenParams<PharmaciesStackParamList>;
  Orders: NavigatorScreenParams<OrdersStackParamList>;
  Reminders: NavigatorScreenParams<RemindersStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type PharmaciesStackParamList = {
  PharmaciesList: undefined;
  PharmacyMap: undefined;
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetails: { orderId: string };
};

export type RemindersStackParamList = {
  RemindersList: undefined;
  MedicationDetails: { scheduleId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  PaymentMethods: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, Screen>;

export type MainStackScreenProps<Screen extends keyof MainStackParamList> =
  StackScreenProps<MainStackParamList, Screen>;

export type AuthStackScreenProps<Screen extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, Screen>;

export type TabScreenProps<Screen extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, Screen>;
