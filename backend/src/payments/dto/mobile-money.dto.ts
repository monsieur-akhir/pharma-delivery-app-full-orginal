import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';

export enum MobileMoneyProvider {
  ORANGE = 'ORANGE',
  MTN = 'MTN',
  MOOV = 'MOOV',
  WAVE = 'WAVE',
}

export class MobileMoneyPaymentDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(MobileMoneyProvider)
  provider: MobileMoneyProvider;

  @IsNotEmpty()
  @IsPhoneNumber(null, { message: 'Phone number must be valid' })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  currency?: string = 'XOF'; // Default to CFA Franc BCEAO used in West Africa
}

export class VerifyMobileMoneyPaymentDto {
  @IsNotEmpty()
  @IsString()
  transactionReference: string;

  @IsNotEmpty()
  @IsNumber()
  orderId: number;
}

export class MobileMoneyWebhookDto {
  @IsNotEmpty()
  @IsString()
  transactionReference: string;

  @IsNotEmpty()
  @IsString()
  status: 'success' | 'failed' | 'pending';

  @IsNotEmpty()
  @IsPhoneNumber(null, { message: 'Phone number must be valid' })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @IsString()
  message?: string;
}