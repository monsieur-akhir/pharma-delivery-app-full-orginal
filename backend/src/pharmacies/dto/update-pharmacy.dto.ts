import { IsOptional, IsString, IsPhoneNumber, IsObject, IsBoolean } from 'class-validator';

export class UpdatePharmacyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsObject()
  location?: { lat: number; lng: number };
  
  @IsOptional()
  @IsString()
  license_number?: string;

  @IsOptional()
  @IsBoolean()
  is_24_hours?: boolean;

  @IsOptional()
  @IsObject()
  operating_hours?: { 
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}