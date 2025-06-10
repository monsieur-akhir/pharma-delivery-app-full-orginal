export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'mobile_money' | 'cash';
  icon: string;
  isDefault?: boolean;
}

export interface PaymentMethodOption {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'card' | 'mobile_money' | 'cash';
  enabled: boolean;
}

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export interface MobileMoneyDetails {
  phoneNumber: string;
  provider: 'mtn' | 'orange' | 'airtel';
}