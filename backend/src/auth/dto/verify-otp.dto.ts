import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Identifiant de l\'utilisateur (email, téléphone ou nom d\'utilisateur)',
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'L\'identifiant est requis' })
  @IsString({ message: 'L\'identifiant doit être une chaîne de caractères' })
  identifier: string;

  @ApiProperty({
    description: 'Code OTP reçu par email ou SMS',
    example: '123456',
    required: true,
  })
  @IsNotEmpty({ message: 'Le code OTP est requis' })
  @IsString({ message: 'Le code OTP doit être une chaîne de caractères' })
  @Length(6, 6, { message: 'Le code OTP doit contenir exactement 6 caractères' })
  otp: string;
}