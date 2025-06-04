import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

enum StaffRole {
  STAFF = 'STAFF',
  MANAGER = 'MANAGER',
  PHARMACIST = 'PHARMACIST',
}

export class AddStaffDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsEnum(StaffRole)
  role: StaffRole;

  @IsOptional()
  @IsString()
  position?: string;
}