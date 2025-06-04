import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus, VehicleType } from './delivery.dto';

export class DeliveryFilterDto {
  @ApiPropertyOptional({ description: 'Filter by delivery status', enum: DeliveryStatus })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Filter by pharmacy ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pharmacyId?: number;

  @ApiPropertyOptional({ description: 'Filter by delivery person ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryPersonId?: number;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @ApiPropertyOptional({ description: 'Filter by vehicle type', enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ description: 'Filter by delivery date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Filter deliveries created after this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter deliveries created before this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search by address or notes' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order (asc or desc)', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}