import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums'; // Import the UserRole enum

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id!: number;

  @ApiProperty({ description: 'Full name of the user (combined from first_name and last_name)', nullable: true })
  name?: string;

  @ApiProperty({ description: 'Email address of the user' })
  email!: string;

  @ApiProperty({ description: 'Username', nullable: true })
  username?: string;

  @ApiProperty({ description: 'Phone number', nullable: true })
  phone?: string;

  @ApiProperty({ description: 'Role of the user', enum: UserRole, example: UserRole.CUSTOMER })
  role!: UserRole;

  @ApiProperty({ description: 'Status of the user (derived from is_active)' })
  status!: string;

  @ApiProperty({ description: 'Associated Pharmacy ID', nullable: true })
  pharmacy_id?: number;
  @ApiProperty({ description: 'URL of the user profile image', nullable: true })
  avatar_url?: string;
  
  @ApiProperty({ description: 'User preferences object', nullable: true, type: 'object', additionalProperties: true })
  preferences?: any;
  
  @ApiProperty({ description: 'First name of the user', nullable: true })
  first_name?: string;
  
  @ApiProperty({ description: 'Last name of the user', nullable: true })
  last_name?: string;
  
  @ApiProperty({ description: 'User address', nullable: true })
  address?: string;
  
  @ApiProperty({ description: 'User location coordinates', nullable: true, type: 'object', additionalProperties: true })
  location?: { lat: number; lng: number };
  
  @ApiProperty({ description: 'Whether the user account is active' })
  is_active!: boolean;
  
  @ApiProperty({ description: 'Timestamp of the last login', nullable: true })
  last_login?: Date;
  
  @ApiProperty({ description: 'Stripe customer ID', nullable: true })
  stripe_customer_id?: string;
  
  @ApiProperty({ description: 'Stripe subscription ID', nullable: true })
  stripe_subscription_id?: string;
  
  @ApiProperty({ description: 'Timestamp of user creation' })
  created_at!: Date;

  @ApiProperty({ description: 'Timestamp of last update' })
  updated_at!: Date;
}
