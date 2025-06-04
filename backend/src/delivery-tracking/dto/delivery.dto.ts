import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsEnum, IsObject, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum DeliveryStatus {
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum VehicleType {
  BIKE = 'bike',
  MOPED = 'moped',
  CAR = 'car'
}

export class GeoLocation {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Timestamp of the location update' })
  @Type(() => Date)
  @IsDate()
  timestamp: Date;

  @ApiProperty({ description: 'Accuracy of the location in meters', required: false })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class AddressInfo {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Additional address details', required: false })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

export class DeliveryDto {
  @ApiProperty({ description: 'Unique delivery ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Associated order ID' })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: 'Pharmacy ID from which the delivery originated' })
  @IsNumber()
  pharmacyId: number;

  @ApiProperty({ description: 'User ID of customer receiving the delivery' })
  @IsNumber()
  customerId: number;

  @ApiProperty({ description: 'User ID of person making the delivery', required: false })
  @IsOptional()
  @IsNumber()
  deliveryPersonId?: number;

  @ApiProperty({ description: 'Current delivery status', enum: DeliveryStatus })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiProperty({ description: 'Type of vehicle used for delivery', enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ description: 'Pickup location information' })
  @IsObject()
  pickupLocation: {
    address: AddressInfo;
    geoLocation: GeoLocation;
  };

  @ApiProperty({ description: 'Delivery location information' })
  @IsObject()
  deliveryLocation: {
    address: AddressInfo;
    geoLocation: GeoLocation;
  };

  @ApiProperty({ description: 'Current location of the delivery person', required: false })
  @IsOptional()
  @IsObject()
  currentLocation?: GeoLocation;

  @ApiProperty({ description: 'History of location updates', type: [GeoLocation] })
  @IsArray()
  locationHistory: GeoLocation[];

  @ApiProperty({ description: 'Estimated time of arrival', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  eta?: Date;

  @ApiProperty({ description: 'Estimated time of departure', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  etd?: Date;

  @ApiProperty({ description: 'Actual departure time', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  departureTime?: Date;

  @ApiProperty({ description: 'Actual delivery time', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deliveryTime?: Date;

  @ApiProperty({ description: 'Notes for the delivery', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Delivery route information', required: false })
  @IsOptional()
  @IsObject()
  route?: any;

  @ApiProperty({ description: 'Creation timestamp' })
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}