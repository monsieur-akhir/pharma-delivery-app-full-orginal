// Stripe types for React Native
export interface StripeCardDetails {
  complete: boolean;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  postalCode?: string;
}

export interface StripeConfirmParams {
  paymentMethodType?: 'Card' | string;
  paymentMethodData?: {
    billingDetails?: {
      email?: string;
      phone?: string;
      address?: {
        city?: string;
        country?: string;
        line1?: string;
        line2?: string;
        postalCode?: string;
        state?: string;
      };
    };
  };
}

export interface StripeCardFieldProps {
  postalCodeEnabled?: boolean;
  placeholders?: {
    number?: string;
  };
  cardStyle?: {
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
  };
  style?: any;
  onCardChange?: (cardDetails: any) => void;
}

export interface ConfirmParams {
  paymentMethodType?: string;
}

export interface StripeMethods {
  focus?: () => void;
  blur?: () => void;
  clear?: () => void;
}