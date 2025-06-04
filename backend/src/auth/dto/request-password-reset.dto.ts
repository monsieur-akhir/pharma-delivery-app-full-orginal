import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl, IsIn } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Identifiant de l\'utilisateur (email, téléphone ou nom d\'utilisateur)',
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'L\'identifiant est requis' })
  @IsString({ message: 'L\'identifiant doit être une chaîne de caractères' })
  identifier: string;

  @ApiProperty({
    description: 'URL de redirection pour réinitialiser le mot de passe (optionnel)',
    example: 'https://app.medi-delivery.com/reset-password',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'L\'URL de redirection doit être une chaîne de caractères' })
  @IsUrl({}, { message: 'L\'URL de redirection doit être une URL valide' })
  redirectUrl?: string;

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