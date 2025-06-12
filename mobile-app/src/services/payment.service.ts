import { API_BASE_URL } from '../config';

interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

interface MobileMoneyPayment {
  orderId: string;
  amount: number;
  phoneNumber: string;
  provider: 'mtn' | 'orange' | 'moov';
}

class PaymentService {
  private baseURL = API_BASE_URL;

  async createPaymentIntent(amount: number, orderId: string): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.baseURL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, orderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async processMobileMoneyPayment(payment: MobileMoneyPayment): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/payments/mobile-money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
      });

      if (!response.ok) {
        throw new Error('Failed to process mobile money payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing mobile money payment:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }
}

const paymentService = new PaymentService();
export { paymentService };
export default paymentService;