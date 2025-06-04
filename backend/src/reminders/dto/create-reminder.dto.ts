import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export class CreateReminderDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  medicineName: string;

  @IsOptional()
  @IsNumber()
  medicineId?: number;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsNotEmpty()
  @IsObject()
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    times: { hour: number; minute: number }[];
    days?: number[]; // days of week (0-6) or days of month (1-31)
  };

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}