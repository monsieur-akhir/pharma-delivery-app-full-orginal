import { IsNotEmpty, IsNumber, IsArray, IsString, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class SupplierOrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  medicineId: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class CreateSupplierOrderDto {
  @IsNotEmpty()
  @IsNumber()
  pharmacyId: number;

  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierOrderItemDto)
  items: SupplierOrderItemDto[];

  @IsOptional()
  @IsEnum(['pending', 'approved', 'ordered', 'received', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}