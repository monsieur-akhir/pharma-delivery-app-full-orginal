import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional, IsArray, IsObject, IsNumber, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from './notification-types.enum';
import { NotificationPriority } from './notification-priority.enum';
import { NotificationActionDto } from './notification-response.dto';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority = NotificationPriority.MEDIUM;

  @ApiProperty({ description: 'User ID of recipient' })
  @IsNumber()
  recipientId: number;

  @ApiPropertyOptional({ description: 'Whether the notification has actions', default: false })
  @IsOptional()
  @IsBoolean()
  actionable?: boolean = false;

  @ApiPropertyOptional({ description: 'Notification actions', type: [NotificationActionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationActionDto)
  actions?: NotificationActionDto[];

  @ApiPropertyOptional({ description: 'Related entity ID (e.g., order ID)' })
  @IsOptional()
  @IsNumber()
  entityId?: number;

  @ApiPropertyOptional({ description: 'Related entity type (e.g., "order")' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Expiration time for temporary notifications' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}