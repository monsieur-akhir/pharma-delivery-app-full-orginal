import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsNumber()
  senderId: number;

  @IsOptional()
  @IsNumber()
  receiverId?: number;

  @IsOptional()
  @IsNumber()
  orderId?: number;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}