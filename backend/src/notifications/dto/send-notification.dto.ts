import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional, IsArray, IsObject, IsDate, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from './notification-types.enum';
import { NotificationPriority } from './notification-priority.enum';
import { NotificationActionDto } from './notification-response.dto';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  APP = 'app',
  ALL = 'all'
}

export class SendNotificationDto {
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

  @ApiProperty({ description: 'Delivery channels', enum: NotificationChannel, isArray: true, default: [NotificationChannel.APP] })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[] = [NotificationChannel.APP];

  @ApiProperty({ description: 'Recipients selection method', enum: ['all', 'role', 'pharmacy', 'users'] })
  @IsEnum(['all', 'role', 'pharmacy', 'users'])
  recipientType: 'all' | 'role' | 'pharmacy' | 'users';

  @ApiPropertyOptional({ description: 'Role name when recipientType is "role"' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Pharmacy ID when recipientType is "pharmacy"' })
  @IsOptional()
  @IsNumber()
  pharmacyId?: number;

  @ApiPropertyOptional({ description: 'User IDs when recipientType is "users"', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds?: number[];

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

  @ApiPropertyOptional({ description: 'Email template to use for email notifications' })
  @IsOptional()
  @IsString()
  emailTemplate?: string;

  @ApiPropertyOptional({ description: 'SMS template to use for SMS notifications' })
  @IsOptional()
  @IsString()
  smsTemplate?: string;

  @ApiPropertyOptional({ description: 'Expiration time for temporary notifications' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Schedule notification for later delivery' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledFor?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}