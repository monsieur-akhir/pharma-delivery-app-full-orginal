import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from './notification-types.enum';
import { NotificationPriority } from './notification-priority.enum';

export class NotificationFilterDto {
  @ApiPropertyOptional({ description: 'Filter by notification type', enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  read?: boolean;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Search in title and content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type (e.g., "order")' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  entityId?: number;

  @ApiPropertyOptional({ description: 'Show only actionable notifications' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  actionable?: boolean;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', default: 'timestamp' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @ApiPropertyOptional({ description: 'Sort order (asc or desc)', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}