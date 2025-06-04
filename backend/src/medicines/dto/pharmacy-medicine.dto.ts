// src/medicines/dto/pharmacy-medicine.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

/**
 * DTO pour l'association médicament-pharmacie
 */
export class PharmacyMedicineDto {
  @ApiProperty({ description: 'ID du médicament' })
  @IsNotEmpty()
  @IsNumber()
  medicineId: number;

  @ApiProperty({ description: 'Prix unitaire en pharmacie' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ description: 'Quantité en stock en pharmacie' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  stockQuantity: number;
}