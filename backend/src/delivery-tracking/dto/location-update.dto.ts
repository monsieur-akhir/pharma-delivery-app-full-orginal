import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class LocationUpdateDto {
  @ApiProperty({ description: 'Delivery ID' })
  @IsNumber()
  deliveryId: number;

  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ description: 'Accuracy of the location in meters', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiProperty({ description: 'Altitude in meters', required: false })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiProperty({ description: 'Speed in meters per second', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiProperty({ description: 'Heading in degrees (0-360)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;
}