
import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Onboarding: undefined;
  OtpVerification: { phone: string; userType: string };
};

export type MainTabParamList = {
  Home: undefined;
  Orders: undefined;
  Pharmacies: undefined;
  Reminders: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Orders: undefined;
  OrdersMain: undefined;
  Pharmacies: undefined;
  PharmaciesMain: undefined;
  Reminders: undefined;
  RemindersMain: undefined;
  Profile: undefined;
  ProfileMain: undefined;
  MedicineDetail: { medicineId: number };
  PharmacyDetail: { pharmacyId: number; medicineId?: number };
  OrderDetails: { orderId: number };
  TrackOrder: { orderId: number; orderNumber?: string };
  PrescriptionDetail: { prescriptionId: number };
  PrescriptionUpload: undefined;
  VideoChat: { pharmacistId?: number; orderId?: number; roomId?: string };
  MedicationReminders: undefined;
  PharmacyMap: { latitude?: number; longitude?: number };
  CardPayment: { orderId: number; amount: number };
  MobileMoneyPayment: { orderId: number; amount: number; transactionReference?: string };
  AddPaymentMethod: undefined;
  Support: { orderId: number };
  RateOrder: { orderId: number };
  Checkout: { items: Array<any> };
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Onboarding: undefined;
  OtpVerification: { phone: string; userType: string };
};
