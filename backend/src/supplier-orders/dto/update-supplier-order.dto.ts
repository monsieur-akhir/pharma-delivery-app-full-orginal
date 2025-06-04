import { IsOptional, IsNumber, IsArray, IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierOrderItemDto } from './create-supplier-order.dto';

export class UpdateSupplierOrderDto {
  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierOrderItemDto)
  items?: SupplierOrderItemDto[];

  @IsOptional()
  @IsEnum(['pending', 'approved', 'ordered', 'received', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  total?: number;
}