import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateDeliveryDto {
  @IsOptional()
  @IsObject()
  location?: { lat: number; lng: number };
  
  @IsOptional()
  @IsNumber()
  estimatedTimeInMinutes?: number;
  
  @IsOptional()
  @IsString()
  deliveryStatus?: string;
  
  @IsOptional()
  @IsString()
  notes?: string;
}