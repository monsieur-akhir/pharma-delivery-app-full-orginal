// src/medicines/dto/medicine-filter.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, IsInt, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * DTO pour filtrer et paginer la liste des médicaments
 */
export class MedicineFilterDto {
  @ApiPropertyOptional({ description: 'Filtrer par nom de médicament' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filtrer par fabricant' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Prix minimum' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Prix maximum' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Catégorie thérapeutique' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filtrer par disponibilité en stock' })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'ID de la pharmacie' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pharmacyId?: number;

  @ApiPropertyOptional({ description: 'Champ pour le tri (ex. name, price)' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Ordre de tri (ASC ou DESC)', enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({ description: 'Numéro de page', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ description: "Nombre d'éléments par page", example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}