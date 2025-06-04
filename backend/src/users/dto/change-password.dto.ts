import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The current password of the user', minLength: 8, maxLength: 50 })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  oldPassword!: string;

  @ApiProperty({ 
    description: 'The new password for the user. Must be 8-50 characters, include uppercase, lowercase, number, and special character.',
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
  newPassword!: string;
}
