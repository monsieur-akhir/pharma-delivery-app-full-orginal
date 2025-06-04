import { IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class RecordMedicationDto {
  @IsNotEmpty()
  @IsNumber()
  reminderId: number;

  @IsNotEmpty()
  @IsDateString()
  takenAt: string;
}