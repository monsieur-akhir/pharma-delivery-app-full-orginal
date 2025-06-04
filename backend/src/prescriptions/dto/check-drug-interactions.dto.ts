import { IsArray, IsNotEmpty } from 'class-validator';

export class CheckDrugInteractionsDto {
  @IsNotEmpty()
  @IsArray()
  medications: string[];
}