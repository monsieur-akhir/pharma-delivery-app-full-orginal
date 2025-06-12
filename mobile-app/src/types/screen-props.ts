import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList, TabParamList, AuthStackParamList } from './navigation';

// Screen prop types for proper navigation typing
export type DeliveryDashboardScreenProps = {
  navigation: StackNavigationProp<MainStackParamList, 'DeliveryDashboard'>;
};

export type DeliveryDetailsScreenProps = {
  route: RouteProp<MainStackParamList, 'DeliveryDetail'>;
  navigation: StackNavigationProp<MainStackParamList, 'DeliveryDetail'>;
};

export type DeliveryEarningsScreenProps = {
  navigation: StackNavigationProp<MainStackParamList>;
};

export type DeliveryHistoryScreenProps = {
  navigation: StackNavigationProp<MainStackParamList>;
};

export type OtpVerificationScreenProps = {
  route: RouteProp<AuthStackParamList, 'OTP'>;
  navigation: StackNavigationProp<AuthStackParamList, 'OTP'>;
};

export type PharmacyMapScreenProps = {
  navigation: StackNavigationProp<TabParamList, 'PharmacyMap'>;
};

export type VideoChatScreenProps = {
  route: RouteProp<MainStackParamList, 'VideoChat'>;
  navigation: StackNavigationProp<MainStackParamList, 'VideoChat'>;
};