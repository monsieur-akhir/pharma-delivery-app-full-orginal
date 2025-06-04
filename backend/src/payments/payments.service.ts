import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { orders, users, pharmacy_medicines, medicines } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { config } from '../../src/config';
import { MobileMoneyProvider } from './dto/mobile-money.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);
  private readonly mobileMoney = config.payment.mobileMoney;

  constructor(private readonly databaseService: DatabaseService) {
    if (!process.env.STRIPE_SECRET_KEY) {
      this.logger.warn('Missing Stripe API key. Some payment features might not work correctly.');
    } else {
      // Use the latest available API version as of May 2025
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  async createPaymentIntent(
    userId: number,
    orderId: number,
    amount: number,
    currency: string = 'usd'
  ) {
    try {
      // Create a payment intent with the order amount and currency
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          userId: userId.toString(),
          orderId: orderId.toString(),
        },
      });

      // Update the order with the payment intent ID
      await this.databaseService.db
        .update(orders)
        .set({
          payment_intent_id: paymentIntent.id,
          updated_at: new Date(),
        })
        .where(eq(orders.id, orderId));

      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      // Retrieve the payment intent to check its status
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Find the order associated with this payment intent
      const [order] = await this.databaseService.db
        .select()
        .from(orders)
        .where(eq(orders.payment_intent_id, paymentIntentId));
      
      if (!order) {
        throw new Error('Order not found for this payment intent');
      }
      
      // Check if the payment is successful
      if (paymentIntent.status === 'succeeded') {
        // Update the order payment status
        await this.databaseService.db
          .update(orders)
          .set({
            payment_status: 'completed',
            updated_at: new Date(),
          })
          .where(eq(orders.id, order.id));
        
        return { 
          success: true, 
          orderId: order.id, 
          status: 'Payment confirmed and order updated' 
        };
      } else {
        return { 
          success: false, 
          orderId: order.id, 
          status: `Payment not yet succeeded. Current status: ${paymentIntent.status}` 
        };
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  async createCustomer(userId: number, email: string, name: string) {
    try {
      // Create a customer in Stripe
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString(),
        },
      });

      // Update the user with the Stripe customer ID
      await this.databaseService.db
        .update(users)
        .set({
          stripe_customer_id: customer.id,
          updated_at: new Date(),
        })
        .where(eq(users.id, userId));

      return { customerId: customer.id };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    try {
      // Verify webhook signature using your webhook secret
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event;

      if (webhookSecret) {
        event = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret
        );
      } else {
        throw new Error('Missing Stripe webhook secret');
      }

      // Handle specific events
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        // Add more event handlers as needed
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error(`Webhook error: ${error.message}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const orderId = Number(paymentIntent.metadata.orderId);
      
      // Update order status
      await this.databaseService.db
        .update(orders)
        .set({
          payment_status: 'completed',
          updated_at: new Date(),
        })
        .where(eq(orders.id, orderId));
      
      console.log(`Payment for order ${orderId} succeeded`);
    } catch (error) {
      console.error('Error handling payment succeeded webhook:', error);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const orderId = Number(paymentIntent.metadata.orderId);
      
      // Update order status
      await this.databaseService.db
        .update(orders)
        .set({
          payment_status: 'failed',
          updated_at: new Date(),
        })
        .where(eq(orders.id, orderId));
      
      console.log(`Payment for order ${orderId} failed`);
    } catch (error) {
      console.error('Error handling payment failed webhook:', error);
    }
  }

  async getProductPrice(pharmacyId: number, medicineId: number) {
    const [pharmacyMedicine] = await this.databaseService.db
      .select()
      .from(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          eq(pharmacy_medicines.medicine_id, medicineId)
        )
      );
    
    if (!pharmacyMedicine) {
      throw new Error('Medicine not available at this pharmacy');
    }
    
    return pharmacyMedicine.price;
  }

  /**
   * Initiate a mobile money payment
   */
  async initiateMobileMoneyPayment(
    userId: number,
    orderId: number,
    amount: number,
    provider: MobileMoneyProvider,
    phoneNumber: string,
    currency: string = 'XOF'
  ) {
    try {
      this.logger.log(`Initiating mobile money payment for order ${orderId} with provider ${provider}`);
      
      // Check if mobile money is enabled
      if (!this.mobileMoney.enabled) {
        throw new Error('Mobile money payments are not enabled');
      }
      
      // Check if the provider is supported
      const supportedProvider = this.mobileMoney.providers.find(p => p.code === provider && p.enabled);
      if (!supportedProvider) {
        throw new Error(`Payment provider ${provider} is not supported or enabled`);
      }
      
      // Generate a unique transaction reference
      const transactionReference = `MM-${uuidv4().substring(0, 8)}-${orderId}`;
      
      // In production, this would call the actual mobile money provider's API
      // For demo purposes, we're simulating the API call
      
      if (config.demoMode) {
        this.logger.log('Running in demo mode, simulating mobile money payment');
        
        // Update the order with the transaction reference
        await this.databaseService.db
          .update(orders)
          .set({
            payment_method: 'MOBILE_MONEY',
            payment_provider: provider,
            transaction_reference: transactionReference,
            payment_status: 'pending',
            updated_at: new Date(),
          })
          .where(eq(orders.id, orderId));
        
        return {
          success: true,
          transactionReference,
          providerName: supportedProvider.name,
          message: `Simulated payment request sent to ${phoneNumber}. Please check your mobile phone for payment confirmation.`,
          status: 'pending',
        };
      }
      
      // In production, this would be the actual API call to the mobile money provider
      try {
        // Example API call (this would be replaced with actual provider's API)
        const response = await axios.post(`https://api.mobilemoney.example/${provider.toLowerCase()}/request`, {
          amount,
          currency,
          phoneNumber,
          reference: transactionReference,
          description: `Payment for order #${orderId}`,
        }, {
          headers: {
            'Authorization': `Bearer ${process.env[`${provider}_API_KEY`] || 'demo-key'}`,
            'Content-Type': 'application/json',
          },
        });
        
        // Update the order with the transaction reference
        await this.databaseService.db
          .update(orders)
          .set({
            payment_method: 'MOBILE_MONEY',
            payment_provider: provider,
            transaction_reference: transactionReference,
            payment_status: 'pending',
            updated_at: new Date(),
          })
          .where(eq(orders.id, orderId));
        
        return {
          success: true,
          transactionReference,
          providerReference: response.data.providerReference || null,
          providerName: supportedProvider.name,
          message: response.data.message || 'Payment request sent. Please check your mobile phone for payment confirmation.',
          status: 'pending',
        };
      } catch (apiError) {
        this.logger.error(`Mobile money API error: ${apiError.message}`);
        throw new Error(`Failed to initiate mobile money payment: ${apiError.message}`);
      }
    } catch (error) {
      this.logger.error(`Error initiating mobile money payment: ${error.message}`);
      throw new Error(`Failed to initiate mobile money payment: ${error.message}`);
    }
  }

  /**
   * Verify the status of a mobile money payment
   */
  async verifyMobileMoneyPayment(transactionReference: string, orderId: number) {
    try {
      this.logger.log(`Verifying mobile money payment for transaction ${transactionReference}`);
      
      // Get the order to check payment provider
      const [order] = await this.databaseService.db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.transaction_reference, transactionReference)
          )
        );
      
      if (!order) {
        throw new Error('Order not found or transaction reference does not match');
      }
      
      // For demo mode, simulate a successful payment
      if (config.demoMode) {
        this.logger.log('Running in demo mode, simulating payment verification');
        
        // Update the order payment status
        await this.databaseService.db
          .update(orders)
          .set({
            payment_status: 'completed',
            updated_at: new Date(),
          })
          .where(eq(orders.id, orderId));
        
        return {
          success: true,
          status: 'completed',
          message: 'Payment completed successfully',
          orderId: order.id,
        };
      }
      
      // In production, this would be the actual API call to verify the payment
      const provider = order.payment_provider;
      
      try {
        // Example API call (this would be replaced with actual provider's API)
        const response = await axios.get(`https://api.mobilemoney.example/${provider.toLowerCase()}/status/${transactionReference}`, {
          headers: {
            'Authorization': `Bearer ${process.env[`${provider}_API_KEY`] || 'demo-key'}`,
          },
        });
        
        const paymentStatus = response.data.status === 'SUCCESS' ? 'completed' : 
                            response.data.status === 'FAILED' ? 'failed' : 'pending';
        
        // Update the order payment status
        await this.databaseService.db
          .update(orders)
          .set({
            payment_status: paymentStatus,
            updated_at: new Date(),
          })
          .where(eq(orders.id, orderId));
        
        return {
          success: paymentStatus === 'completed',
          status: paymentStatus,
          message: response.data.message || `Payment status: ${paymentStatus}`,
          orderId: order.id,
        };
      } catch (apiError) {
        this.logger.error(`Mobile money verification API error: ${apiError.message}`);
        throw new Error(`Failed to verify mobile money payment: ${apiError.message}`);
      }
    } catch (error) {
      this.logger.error(`Error verifying mobile money payment: ${error.message}`);
      throw new Error(`Failed to verify mobile money payment: ${error.message}`);
    }
  }

  /**
   * Handle mobile money webhook callbacks from payment providers
   */
  async handleMobileMoneyWebhook(data: any) {
    try {
      this.logger.log(`Received mobile money webhook: ${JSON.stringify(data)}`);
      
      const { transactionReference, status, phoneNumber, providerReference, message } = data;
      
      // Find the order associated with this transaction
      const [order] = await this.databaseService.db
        .select()
        .from(orders)
        .where(eq(orders.transaction_reference, transactionReference));
      
      if (!order) {
        throw new Error(`Order not found for transaction reference: ${transactionReference}`);
      }
      
      // Map the provider status to our internal status
      const paymentStatus = status === 'success' ? 'completed' : 
                          status === 'failed' ? 'failed' : 'pending';
      
      // Update the order payment status
      await this.databaseService.db
        .update(orders)
        .set({
          payment_status: paymentStatus,
          updated_at: new Date(),
        })
        .where(eq(orders.id, order.id));
      
      this.logger.log(`Updated payment status for order ${order.id} to ${paymentStatus}`);
      
      return { 
        received: true, 
        orderId: order.id, 
        status: paymentStatus 
      };
    } catch (error) {
      this.logger.error(`Mobile money webhook error: ${error.message}`);
      throw new Error(`Mobile money webhook error: ${error.message}`);
    }
  }

  /**
   * Get available mobile money providers
   */
  getAvailableMobileMoneyProviders() {
    if (!this.mobileMoney.enabled) {
      return { enabled: false, providers: [] };
    }
    
    return {
      enabled: true,
      providers: this.mobileMoney.providers
        .filter(provider => provider.enabled)
        .map(provider => ({
          code: provider.code,
          name: provider.name,
        })),
    };
  }
}