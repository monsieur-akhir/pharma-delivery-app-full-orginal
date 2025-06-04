import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../enums'; // Import the UserRole enum

export class UserFilterDto {
  @ApiPropertyOptional({ description: 'Filter by user role', enum: UserRole, example: UserRole.CUSTOMER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by user status', enum: ['active', 'inactive', 'pending', 'blocked'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'pending', 'blocked'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by pharmacy ID' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  pharmacyId?: number;

  @ApiPropertyOptional({ description: 'Search by name, email, or username' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
