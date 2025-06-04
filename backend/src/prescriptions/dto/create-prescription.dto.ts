import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePrescriptionDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;

  @IsOptional()
  @IsNumber()
  orderId?: number;

  @IsOptional()
  aiAnalysis?: any;
}