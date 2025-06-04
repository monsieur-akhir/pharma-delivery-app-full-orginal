import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyPasswordResetDto {
  @ApiProperty({
    description: 'Identifiant de l\'utilisateur (email, téléphone ou nom d\'utilisateur)',
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'L\'identifiant est requis' })
  @IsString({ message: 'L\'identifiant doit être une chaîne de caractères' })
  identifier: string;

  @ApiProperty({
    description: 'Token de réinitialisation reçu par email ou SMS',
    example: '123456',
    required: true,
  })
  @IsNotEmpty({ message: 'Le token est requis' })
  @IsString({ message: 'Le token doit être une chaîne de caractères' })
  @Length(6, 6, { message: 'Le token doit contenir exactement 6 caractères' })
  token: string;

  @ApiProperty({
    description: 'Code de vérification reçu par email ou SMS',
    example: '123456',
    required: false,
  })
  @IsNotEmpty({ message: 'Le code de vérification est requis' })
  @IsString({ message: 'Le code de vérification doit être une chaîne de caractères' })
  @Length(6, 6, { message: 'Le code de vérification doit contenir exactement 6 caractères' })
  resetCode: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'P@ssw0rd_123',
    required: true,
  })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  @IsString({ message: 'Le nouveau mot de passe doit être une chaîne de caractères' })
  @Length(8, 50, { message: 'Le mot de passe doit contenir entre 8 et 50 caractères' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre ou un caractère spécial',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation du nouveau mot de passe',
    example: 'P@ssw0rd_123',
    required: true,
  })
  @IsNotEmpty({ message: 'La confirmation du mot de passe est requise' })
  @IsString({ message: 'La confirmation du mot de passe doit être une chaîne de caractères' })
  confirmPassword: string;
}