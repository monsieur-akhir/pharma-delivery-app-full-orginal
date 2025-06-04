import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray } from 'class-validator';

export class OrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  medicineId: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  price?: number;
}

export class CreatePaymentIntentDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class ConfirmPaymentDto {
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;
}

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}