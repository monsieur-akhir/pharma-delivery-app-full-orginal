import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpAdminDto {
  @ApiProperty({
    description: 'Username of the admin user',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}