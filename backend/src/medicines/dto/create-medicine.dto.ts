// src/medicines/dto/create-medicine.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsPositive, Min, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour la création d'un médicament
 */
export class CreateMedicineDto {
  @ApiProperty({ description: 'Nom du médicament' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Nom générique du médicament' })
  @IsString()
  generic: string;

  @ApiProperty({ description: 'Catégorie thérapeutique du médicament' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Posologie (ex. : 500mg)' })
  @IsString()
  dosage: string;

  @ApiProperty({ description: 'Quantité en stock actuelle' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: 'Seuil minimal de stock pour alerte' })
  @IsNumber()
  @Min(0)
  minStock: number;

  @ApiProperty({ description: 'Capacité maximale de stockage' })
  @IsNumber()
  @IsPositive()
  maxStock: number;

  @ApiProperty({ description: 'Prix unitaire du médicament' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ description: "Date d'expiration (ISO 8601)" })
  @Type(() => String)
  @IsDateString()
  expiry: string;

  @ApiPropertyOptional({ description: "ID de la pharmacie où est stocké le médicament" })
  @IsOptional()
  @IsNumber()
  pharmacyId?: number;

  @ApiPropertyOptional({ description: "Description détaillée du médicament" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Nom du fabricant" })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: "Conditions de conservation" })
  @IsOptional()
  @IsString()
  storageRequirements?: string;

  @ApiPropertyOptional({ description: "Prescription requise (true/false)" })
  @IsOptional()
  @IsBoolean()
  prescriptionRequired?: boolean;

  @ApiPropertyOptional({ description: "Effets secondaires éventuels" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sideEffects?: string[];

  @ApiPropertyOptional({ description: "URL de l'image du médicament" })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: "Code-barres du médicament" })
  @IsOptional()
  @IsString()
  barcode?: string;
}