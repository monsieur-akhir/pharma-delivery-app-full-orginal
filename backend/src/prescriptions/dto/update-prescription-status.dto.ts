import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePrescriptionStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isVerified: boolean;  // true for 'verified', false for 'rejected'

  @IsOptional()
  @IsNumber()
  verifiedBy?: number;  // maps to verified_by in database

  @IsOptional()
  @IsString()
  verificationNotes?: string;  // maps to notes in database
}