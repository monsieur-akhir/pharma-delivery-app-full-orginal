import { IsNotEmpty, IsString } from 'class-validator';

export class AnalyzePrescriptionDto {
  @IsNotEmpty()
  @IsString()
  imageBase64: string;
}