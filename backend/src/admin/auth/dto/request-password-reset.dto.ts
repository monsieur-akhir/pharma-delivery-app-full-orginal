import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetAdminDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur ou email de l\'administrateur',
    example: 'admin@example.com',
  })
  @IsString()
  @IsNotEmpty({ message: 'L\'identifiant est requis' })
  identifier: string;

  @ApiProperty({
    description: 'URL de redirection après validation (utilisé pour le web uniquement)',
    example: 'https://votre-app.com/reset-password',
    required: false,
  })
  @IsOptional()
  @IsString()
  redirectUrl?: string;
}