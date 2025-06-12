import api from './api.service';
import { initStripe } from '@stripe/stripe-react-native';
import { VITE_STRIPE_PUBLIC_KEY } from '../config';

/**
 * Payment method type
 */
export type PaymentMethod = 'card' | 'mobileMoney' | 'cash';

/**
 * Mobile money provider type
 */
export type MobileMoneyProvider = 'orange' | 'mtn' | 'moov' | 'wave';

/**
 * Payment intent from Stripe
 */
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Mobile money payment details
 */
export interface MobileMoneyDetails {
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
}

/**
 * Service for handling payment operations
 */
class PaymentService {
  /**
   * Initialize Stripe with publishable key
   */
  async initializeStripe() {
    try {
      await initStripe({
        publishableKey: VITE_STRIPE_PUBLIC_KEY,
        merchantIdentifier: 'merchant.com.medicinedelivery',
      });
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for card payment
   * @param amount Amount in local currency
   * @param currency Currency code (default: 'usd')
   */
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    try {
      const response = await api.post('/payments/create-intent', {
        amount,
        currency
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirm payment was successful
   * @param paymentIntentId Payment intent ID
   */
  async confirmPayment(paymentIntentId: string) {
    try {
      const response = await api.post('/payments/confirm', {
        paymentIntentId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initiate mobile money payment
   * @param provider Mobile money provider
   * @param phoneNumber User's mobile money phone number
   * @param amount Amount to charge
   * @param orderId Order ID
   */
  async initiateMobileMoneyPayment(
    provider: MobileMoneyProvider,
    phoneNumber: string,
    amount: number,
    orderId: number
  ) {
    try {
      const response = await api.post('/payments/mobile-money/initiate', {
        provider,
        phoneNumber,
        amount,
        orderId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check mobile money payment status
   * @param reference Payment reference
   */
  async checkMobileMoneyStatus(reference: string) {
    try {
      const response = await api.get(`/payments/mobile-money/status/${reference}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's saved payment methods
   */
  async getSavedPaymentMethods() {
    try {
      const response = await api.get('/payments/methods');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save a new payment method
   * @param paymentMethodId Stripe payment method ID
   */
  async savePaymentMethod(paymentMethodId: string) {
    try {
      const response = await api.post('/payments/methods', {
        paymentMethodId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a saved payment method
   * @param paymentMethodId Stripe payment method ID
   */
  async deletePaymentMethod(paymentMethodId: string) {
    try {
      const response = await api.delete(`/payments/methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory() {
    try {
      const response = await api.get('/payments/history');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

    /**
   * Get available mobile money providers
   */
  async getMobileMoneyProviders() {
    try {
      const response = await api.get('/payments/mobile-money/providers');
      return response.data;
    } catch (error) {
      console.error('Error fetching mobile money providers:', error);
      throw error;
    }
  }

  /**
   * Process mobile money payment
   * @param paymentData Payment data
   */
  async processMobileMoneyPayment(paymentData: {
    orderId: string;
    amount: number;
    provider: string;
    phoneNumber: string;
  }) {
    try {
      const response = await api.post('/payments/mobile-money', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error processing mobile money payment:', error);
      throw error;
    }
  }
}

export default new PaymentService();