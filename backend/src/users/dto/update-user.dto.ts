import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength, IsNumber, IsIn } from 'class-validator';
import { UserRole } from '../enums'; // Import the UserRole enum

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Full name of the user', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Email address of the user', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Username for login', example: 'johndoe' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  // Password should NOT be updated here. Use ChangePasswordDto or ResetPassword functionality.

  @ApiPropertyOptional({ description: 'Phone number of the user', example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address of the user' })
  @IsOptional()
  @IsString()
  address?: string; // Added address field as it was in service logic

  @ApiPropertyOptional({ description: 'Role of the user', example: UserRole.CUSTOMER, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Status of the user', example: 'active', enum: ['active', 'inactive', 'pending', 'blocked'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'pending', 'blocked'])
  status?: string;

  @ApiPropertyOptional({ description: 'ID of the pharmacy the user belongs to', example: 1 })
  @IsOptional()
  @IsNumber()
  pharmacy_id?: number;

  @ApiPropertyOptional({ description: 'URL of the user avatar' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({ description: 'User preferences object', type: 'object', additionalProperties: true })
  @IsOptional()
  preferences?: any;
}