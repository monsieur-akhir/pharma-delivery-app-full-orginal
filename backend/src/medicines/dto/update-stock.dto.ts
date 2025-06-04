// src/medicines/dto/update-stock.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO pour la mise à jour du stock
 */
export class UpdateStockDto {
  @ApiProperty({ description: 'Variation de stock (positive ou négative)' })
  @IsNotEmpty()
  @IsNumber()
  stockChange: number;
}
