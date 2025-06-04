import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsString, IsOptional } from 'class-validator';
import { DeliveryStatus } from './delivery.dto';

export class DeliveryStatusUpdateDto {
  @ApiProperty({ description: 'Delivery ID' })
  @IsNumber()
  deliveryId: number;

  @ApiProperty({ description: 'New delivery status', enum: DeliveryStatus })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Additional notes about the status update' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Reason for failed or cancelled delivery', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Photo evidence of delivery (base64 encoded)', required: false })
  @IsOptional()
  @IsString()
  photoEvidence?: string;
}