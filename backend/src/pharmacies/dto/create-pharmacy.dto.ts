import { IsNotEmpty, IsOptional, IsString, IsPhoneNumber, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePharmacyDto {
  @ApiProperty({ example: 'Pharmacie Centrale' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Rue de la Santé, 75013 Paris, France' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: '+2250707145879' })
  @IsNotEmpty()
  @IsPhoneNumber('CV')
  phone: string;

  @ApiPropertyOptional({ example: 'contact@pharmacie-centrale.fr' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: { lat: 48.8566, lng: 2.3522 },
    description: 'Coordinates in decimal degrees'
  })
  @IsOptional()
  @IsObject()
  location?: { lat: number; lng: number };
  
  @ApiPropertyOptional({ example: 'LIC-FR-123456' })
  @IsOptional()
  @IsString()
  license_number?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_24_hours?: boolean;

  @ApiPropertyOptional({
    example: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '10:00', close: '16:00' },
    },
    description: 'Weekly opening and closing times'
  })
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

  @ApiPropertyOptional({ example: 'https://pharmacie-centrale.fr' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'https://pharmacie-centrale.fr/logo.png' })
  @IsOptional()
  @IsString()
  image_url?: string;
}