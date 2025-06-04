import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../enums'; // Import the UserRole enum

export class CreateUserDto {
  @ApiProperty({ description: 'Full name of the user', example: 'John Doe' })
  @IsString()
  @IsOptional() // Assuming name can be optional during creation, or added later
  name?: string;

  @ApiProperty({ description: 'Email address of the user', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Username for login', example: 'johndoe' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiProperty({ 
    description: 'Password for the user. Must be 8-50 characters, include uppercase, lowercase, number, and special character.',
    example: 'P@$$wOrd123',
    minLength: 8, 
    maxLength: 50,
    pattern: '/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. Must include uppercase, lowercase, number, and special character.'
  })
  password!: string;

  @ApiPropertyOptional({ description: 'Phone number of the user', example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ description: 'Role of the user', example: UserRole.CUSTOMER, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Status of the user', example: 'pending', enum: ['active', 'inactive', 'pending', 'blocked'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'pending', 'blocked'])
  status?: string;

  @ApiPropertyOptional({ description: 'ID of the pharmacy the user belongs to', example: 1 })
  @IsOptional()
  // @IsNumber() // Add if you have pharmacy_id during creation
  pharmacy_id?: number;

  @ApiPropertyOptional({ description: 'URL of the user avatar' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({ description: 'User preferences object', type: 'object', additionalProperties: true })
  @IsOptional()
  preferences?: any;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  location?: { lat: number; lng: number };

  @IsOptional()
  @IsString()
  profile_image?: string;
}