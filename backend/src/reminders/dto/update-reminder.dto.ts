import { IsOptional, IsObject, IsString, IsDateString, IsBoolean, IsNumber } from 'class-validator';

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  medicineName?: string;

  @IsOptional()
  @IsNumber()
  medicineId?: number;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsObject()
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    times: { hour: number; minute: number }[];
    days?: number[]; // days of week (0-6) or days of month (1-31)
  };

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}