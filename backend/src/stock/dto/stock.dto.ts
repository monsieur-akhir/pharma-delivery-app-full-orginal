import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDate, IsEnum, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export enum StockChangeReason {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  EXPIRY = 'EXPIRY',
  DAMAGE = 'DAMAGE',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT'
}

export class CreateStockDto {
  @ApiProperty({ description: 'Quantité en stock' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Niveau de réapprovisionnement' })
  @IsNumber()
  @Min(1)
  reorderLevel: number;

  @ApiProperty({ description: 'Stock idéal' })
  @IsNumber()
  @Min(1)
  idealStock: number;

  @ApiPropertyOptional({ description: 'Numéro de lot' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;
}

export class UpdateStockDto {
  @ApiPropertyOptional({ description: 'Quantité en stock' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Niveau de réapprovisionnement' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  reorderLevel?: number;

  @ApiPropertyOptional({ description: 'Stock idéal' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  idealStock?: number;

  @ApiPropertyOptional({ description: 'Numéro de lot' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;
}

export class AdjustStockDto {
  @ApiProperty({ description: 'Nouvelle quantité en stock' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Raison du changement', enum: StockChangeReason })
  @IsEnum(StockChangeReason)
  reason: StockChangeReason;

  @ApiPropertyOptional({ description: 'Notes sur l\'ajustement' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TransferStockDto {
  @ApiProperty({ description: 'ID du stock source' })
  @IsNumber()
  @IsNotEmpty()
  sourceStockId: number;

  @ApiProperty({ description: 'ID de la pharmacie de destination' })
  @IsNumber()
  @IsNotEmpty()
  destinationPharmacyId: number;

  @ApiProperty({ description: 'Quantité à transférer' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Notes sur le transfert' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockFilterDto {
  @ApiPropertyOptional({ description: 'ID de la pharmacie' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pharmacyId?: number;

  @ApiPropertyOptional({ description: 'Recherche par nom de médicament' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par catégorie' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Afficher seulement les stocks bas' })
  @IsOptional()
  @Type(() => Boolean)
  lowStock?: boolean;

  @ApiPropertyOptional({ description: 'Numéro de page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite par page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
