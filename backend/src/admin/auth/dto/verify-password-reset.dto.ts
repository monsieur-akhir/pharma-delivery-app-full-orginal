import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPasswordResetAdminDto {
  @ApiProperty({
    description: 'Identifiant de l\'utilisateur (email ou nom d\'utilisateur)',
    example: 'admin@example.com',
  })
  @IsString()
  @IsNotEmpty({ message: 'L\'identifiant de l\'utilisateur est requis' })
  identifier: string;

  @ApiProperty({
    description: 'Code de réinitialisation reçu par email ou SMS',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le code de réinitialisation est requis' })
  resetCode: string;

  @ApiProperty({
    description: 'Nouveau mot de passe (8+ caractères, 1 majuscule, 1 minuscule, 1 chiffre)',
    example: 'Nouveau123@',
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message:
      'Le mot de passe doit contenir au moins 8 caractères, dont une lettre majuscule, une lettre minuscule et un chiffre',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation du nouveau mot de passe',
    example: 'Nouveau123@',
  })
  @IsString()
  @IsNotEmpty({ message: 'La confirmation du mot de passe est requise' })
  confirmPassword: string;
}