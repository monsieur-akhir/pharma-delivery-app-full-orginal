import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Identifiant (nom d\'utilisateur, email ou téléphone)',
    example: 'admin@mediconnect.com',
  })
  @IsNotEmpty({ message: 'L\'identifiant est requis' })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'Mot de passe',
    example: 'MotDePasse123!',
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @IsString()
  password: string;
}
