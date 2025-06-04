import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({
    description: 'Numéro de téléphone du destinataire (format international)',
    example: '+33612345678',
    required: true,
  })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @IsString({ message: 'Le numéro de téléphone doit être une chaîne de caractères' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Le numéro de téléphone doit être au format international (exemple: +33612345678)',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Contenu du message SMS',
    example: 'Votre code de vérification est: 123456',
    required: true,
  })
  @IsNotEmpty({ message: 'Le contenu du message est requis' })
  @IsString({ message: 'Le contenu du message doit être une chaîne de caractères' })
  message: string;
}