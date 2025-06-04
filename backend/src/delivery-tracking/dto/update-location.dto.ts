import { IsNumber, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Latitude of current location',
    example: 5.343434,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude of current location',
    example: -4.024356,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Heading in degrees (0-360)',
    example: 245,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({
    description: 'Speed in kilometers per hour',
    example: 35.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiProperty({
    description: 'GPS accuracy in meters',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiProperty({
    description: 'Battery level as a percentage (0-100)',
    example: 75.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery_level?: number;
}