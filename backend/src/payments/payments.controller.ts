import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  RawBodyRequest,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  CreateCustomerDto
} from './dto/payment-intent.dto';
import {
  MobileMoneyPaymentDto,
  VerifyMobileMoneyPaymentDto,
  MobileMoneyWebhookDto
} from './dto/mobile-money.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a payment intent for an order' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    try {
      const result = await this.paymentsService.createPaymentIntent(
        createPaymentIntentDto.userId,
        createPaymentIntentDto.orderId,
        createPaymentIntentDto.amount,
        createPaymentIntentDto.currency
      );
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('confirm-payment')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Confirm a payment intent' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  async confirmPayment(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    try {
      const result = await this.paymentsService.confirmPayment(
        confirmPaymentDto.paymentIntentId
      );
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('create-customer')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a customer in Stripe' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    try {
      const result = await this.paymentsService.createCustomer(
        createCustomerDto.userId,
        createCustomerDto.email,
        createCustomerDto.name
      );
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiHeader({ name: 'stripe-signature', description: 'Stripe signature for webhook verification' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Headers('stripe-signature') signature: string, @Req() request: RawBodyRequest<Request>) {
    try {
      const rawBody = request.rawBody;
      
      if (!rawBody) {
        throw new Error('No raw body found in the request');
      }
      
      const result = await this.paymentsService.handleWebhook(signature, rawBody);
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Get('mobile-money/providers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get available mobile money providers' })
  @ApiResponse({ status: 200, description: 'List of available mobile money providers' })
  async getMobileMoneyProviders() {
    try {
      const result = await this.paymentsService.getAvailableMobileMoneyProviders();
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('mobile-money/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate a mobile money payment' })
  @ApiResponse({ status: 201, description: 'Mobile money payment initiated successfully' })
  async initiateMobileMoneyPayment(@Body() mobileMoneyPaymentDto: MobileMoneyPaymentDto) {
    try {
      const result = await this.paymentsService.initiateMobileMoneyPayment(
        mobileMoneyPaymentDto.userId,
        mobileMoneyPaymentDto.orderId,
        mobileMoneyPaymentDto.amount,
        mobileMoneyPaymentDto.provider,
        mobileMoneyPaymentDto.phoneNumber,
        mobileMoneyPaymentDto.currency
      );
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('mobile-money/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify a mobile money payment' })
  @ApiResponse({ status: 200, description: 'Mobile money payment verification' })
  async verifyMobileMoneyPayment(@Body() verifyPaymentDto: VerifyMobileMoneyPaymentDto) {
    try {
      const result = await this.paymentsService.verifyMobileMoneyPayment(
        verifyPaymentDto.transactionReference,
        verifyPaymentDto.orderId
      );
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('mobile-money/webhook')
  @ApiOperation({ summary: 'Handle mobile money webhook events' })
  @ApiHeader({ name: 'provider-signature', description: 'Provider signature for webhook verification' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleMobileMoneyWebhook(@Body() webhookData: MobileMoneyWebhookDto) {
    try {
      const result = await this.paymentsService.handleMobileMoneyWebhook(webhookData);
      
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}