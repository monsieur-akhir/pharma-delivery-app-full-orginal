// Payment types for the mobile application

export enum MobileMoneyProvider {
  ORANGE = 'ORANGE',
  MTN = 'MTN',
  MOOV = 'MOOV',
  WAVE = 'WAVE',
}

export enum PaymentMethod {
  CARD = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface MobileMoneyPayment {
  transactionReference: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  icon: string;
  type: PaymentMethod;
}