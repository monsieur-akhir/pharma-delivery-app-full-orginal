import { IsNotEmpty, IsString } from 'class-validator';

export class GetMedicationInfoDto {
  @IsNotEmpty()
  @IsString()
  medicationName: string;
}