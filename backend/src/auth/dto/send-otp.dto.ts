import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Identifiant de l\'utilisateur (email, téléphone ou nom d\'utilisateur)',
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'L\'identifiant est requis' })
  @IsString({ message: 'L\'identifiant doit être une chaîne de caractères' })
  identifier: string;

  @ApiProperty({
    description: 'Mot de passe (requis uniquement pour la première connexion)',
    example: 'P@ssw0rd',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  password?: string;

  @ApiProperty({
    description: 'Canal pour l\'envoi du OTP (email, sms ou both)',
    example: 'both',
    enum: ['email', 'sms', 'both'],
    default: 'both',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le canal doit être une chaîne de caractères' })
  @IsIn(['email', 'sms', 'both'], { message: 'Le canal doit être "email", "sms" ou "both"' })
  channel?: 'email' | 'sms' | 'both';
}