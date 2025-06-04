import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from './notification-types.enum';
import { NotificationPriority } from './notification-priority.enum';
import { NotificationChannel } from './send-notification.dto';

class ChannelPreferencesDto {
  @ApiProperty({ description: 'Enable email notifications', default: true })
  @IsBoolean()
  email: boolean = true;

  @ApiProperty({ description: 'Enable SMS notifications', default: false })
  @IsBoolean()
  sms: boolean = false;

  @ApiProperty({ description: 'Enable push notifications', default: true })
  @IsBoolean()
  push: boolean = true;

  @ApiProperty({ description: 'Enable in-app notifications', default: true })
  @IsBoolean()
  app: boolean = true;
}

class TypePreferencesDto {
  @ApiProperty({ description: 'Enable order notifications', default: true })
  @IsBoolean()
  order: boolean = true;

  @ApiProperty({ description: 'Enable system notifications', default: true })
  @IsBoolean()
  system: boolean = true;

  @ApiProperty({ description: 'Enable pharmacy notifications', default: true })
  @IsBoolean()
  pharmacy: boolean = true;

  @ApiProperty({ description: 'Enable alert notifications', default: true })
  @IsBoolean()
  alert: boolean = true;

  @ApiProperty({ description: 'Enable user notifications', default: true })
  @IsBoolean()
  user: boolean = true;

  @ApiProperty({ description: 'Enable payment notifications', default: true })
  @IsBoolean()
  payment: boolean = true;

  @ApiProperty({ description: 'Enable delivery notifications', default: true })
  @IsBoolean()
  delivery: boolean = true;

  @ApiProperty({ description: 'Enable prescription notifications', default: true })
  @IsBoolean()
  prescription: boolean = true;

  @ApiProperty({ description: 'Enable medicine notifications', default: true })
  @IsBoolean()
  medicine: boolean = true;

  @ApiProperty({ description: 'Enable reminder notifications', default: true })
  @IsBoolean()
  reminder: boolean = true;
}

class PriorityChannelMappingDto {
  @ApiProperty({ description: 'Channels for urgent notifications', default: NotificationChannel.ALL, enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  urgent: NotificationChannel = NotificationChannel.ALL;

  @ApiProperty({ description: 'Channels for high priority notifications', default: NotificationChannel.APP, enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  high: NotificationChannel = NotificationChannel.APP;

  @ApiProperty({ description: 'Channels for medium priority notifications', default: NotificationChannel.APP, enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  medium: NotificationChannel = NotificationChannel.APP;

  @ApiProperty({ description: 'Channels for low priority notifications', default: NotificationChannel.APP, enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  low: NotificationChannel = NotificationChannel.APP;
}

export class NotificationPreferencesDto {
  @ApiProperty({ description: 'Enable notifications', default: true })
  @IsBoolean()
  enabled: boolean = true;

  @ApiProperty({ description: 'Channel preferences', type: ChannelPreferencesDto })
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  channels: ChannelPreferencesDto;

  @ApiProperty({ description: 'Notification type preferences', type: TypePreferencesDto })
  @ValidateNested()
  @Type(() => TypePreferencesDto)
  types: TypePreferencesDto;

  @ApiProperty({ description: 'Priority channel mapping', type: PriorityChannelMappingDto })
  @ValidateNested()
  @Type(() => PriorityChannelMappingDto)
  priorityChannels: PriorityChannelMappingDto;

  @ApiPropertyOptional({ description: 'Quiet hours start (HH:MM)', default: '22:00' })
  @IsOptional()
  quietHoursStart?: string = '22:00';

  @ApiPropertyOptional({ description: 'Quiet hours end (HH:MM)', default: '08:00' })
  @IsOptional()
  quietHoursEnd?: string = '08:00';

  @ApiPropertyOptional({ description: 'Enable quiet hours', default: false })
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean = false;

  @ApiPropertyOptional({ description: 'Custom notification settings for specific entities' })
  @IsOptional()
  @IsObject()
  customSettings?: Record<string, any>;
}