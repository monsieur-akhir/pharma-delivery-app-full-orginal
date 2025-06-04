import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from './notification-types.enum';
import { NotificationPriority } from './notification-priority.enum';

export class NotificationSenderDto {
  @ApiProperty({ description: 'Sender ID' })
  id: number;

  @ApiProperty({ description: 'Sender name' })
  name: string;

  @ApiPropertyOptional({ description: 'Sender role' })
  role?: string;

  @ApiPropertyOptional({ description: 'Sender avatar URL' })
  avatar?: string;
}

export class NotificationActionDto {
  @ApiProperty({ description: 'Action name' })
  name: string;

  @ApiProperty({ description: 'Action icon' })
  icon: string;

  @ApiPropertyOptional({ description: 'Action URL or route' })
  url?: string;

  @ApiPropertyOptional({ description: 'Action color' })
  color?: string;

  @ApiPropertyOptional({ description: 'Action payload' })
  payload?: Record<string, any>;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: number;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification content' })
  content: string;

  @ApiProperty({ description: 'Creation timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Whether the notification has been read' })
  read: boolean;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiProperty({ description: 'Whether the notification has actions' })
  actionable: boolean;

  @ApiPropertyOptional({ description: 'Notification actions', type: [NotificationActionDto] })
  actions?: NotificationActionDto[];

  @ApiPropertyOptional({ description: 'Notification sender information' })
  sender?: NotificationSenderDto;

  @ApiPropertyOptional({ description: 'Related entity ID (e.g., order ID)' })
  entityId?: number;

  @ApiPropertyOptional({ description: 'Related entity type (e.g., "order")' })
  entityType?: string;

  @ApiPropertyOptional({ description: 'Expiration time for temporary notifications' })
  expiresAt?: Date;
}