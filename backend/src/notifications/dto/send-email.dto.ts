import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    description: 'Adresse email du destinataire',
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'L\'adresse email est requise' })
  @IsEmail({}, { message: 'Format d\'email invalide' })
  email: string;

  @ApiProperty({
    description: 'Sujet de l\'email',
    example: 'Confirmation de commande',
    required: true,
  })
  @IsNotEmpty({ message: 'Le sujet est requis' })
  @IsString({ message: 'Le sujet doit être une chaîne de caractères' })
  subject: string;

  @ApiProperty({
    description: 'Contenu textuel de l\'email',
    example: 'Votre commande a été confirmée.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le contenu textuel doit être une chaîne de caractères' })
  text?: string;

  @ApiProperty({
    description: 'Contenu HTML de l\'email',
    example: '<p>Votre commande a été <strong>confirmée</strong>.</p>',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le contenu HTML doit être une chaîne de caractères' })
  html?: string;
}