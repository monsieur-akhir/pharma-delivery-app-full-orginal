import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../enums'; // Import the UserRole enum

export class AssignRoleDto {
  @ApiProperty({ description: 'The role to assign to the user', enum: UserRole, example: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}
