import { ApiProperty } from '@nestjs/swagger';
import { VehicleType, DeliveryStatus } from './delivery.dto';

class DeliveryCountByStatus {
  @ApiProperty({ description: 'Number of deliveries with status: Preparing' })
  preparing: number;

  @ApiProperty({ description: 'Number of deliveries with status: Ready for pickup' })
  readyForPickup: number;

  @ApiProperty({ description: 'Number of deliveries with status: In transit' })
  inTransit: number;

  @ApiProperty({ description: 'Number of deliveries with status: Delivered' })
  delivered: number;

  @ApiProperty({ description: 'Number of deliveries with status: Failed' })
  failed: number;

  @ApiProperty({ description: 'Number of deliveries with status: Cancelled' })
  cancelled: number;
}

class PerformanceByVehicle {
  @ApiProperty({ description: 'Average delivery time in minutes for bike deliveries' })
  bike: number;

  @ApiProperty({ description: 'Average delivery time in minutes for moped deliveries' })
  moped: number;

  @ApiProperty({ description: 'Average delivery time in minutes for car deliveries' })
  car: number;
}

class DeliveryCountByDay {
  @ApiProperty({ description: 'Number of deliveries on Monday' })
  monday: number;

  @ApiProperty({ description: 'Number of deliveries on Tuesday' })
  tuesday: number;

  @ApiProperty({ description: 'Number of deliveries on Wednesday' })
  wednesday: number;

  @ApiProperty({ description: 'Number of deliveries on Thursday' })
  thursday: number;

  @ApiProperty({ description: 'Number of deliveries on Friday' })
  friday: number;

  @ApiProperty({ description: 'Number of deliveries on Saturday' })
  saturday: number;

  @ApiProperty({ description: 'Number of deliveries on Sunday' })
  sunday: number;
}

export class DeliveryStatisticsResponseDto {
  @ApiProperty({ description: 'Total number of active deliveries' })
  activeDeliveries: number;

  @ApiProperty({ description: 'Total number of deliveries completed today' })
  completedToday: number;

  @ApiProperty({ description: 'Total number of scheduled deliveries' })
  scheduledDeliveries: number;

  @ApiProperty({ description: 'Total number of deliveries with issues' })
  deliveriesWithIssues: number;

  @ApiProperty({ description: 'Average delivery time in minutes' })
  averageDeliveryTime: number;

  @ApiProperty({ description: 'Delivery success rate (percentage)' })
  successRate: number;

  @ApiProperty({ description: 'Average distance per delivery in kilometers' })
  averageDistance: number;

  @ApiProperty({ description: 'Average customer satisfaction rating (1-5)' })
  averageSatisfaction: number;

  @ApiProperty({ description: 'Breakdown of deliveries by status' })
  deliveriesByStatus: DeliveryCountByStatus;

  @ApiProperty({ description: 'Average delivery time by vehicle type in minutes' })
  performanceByVehicle: PerformanceByVehicle;

  @ApiProperty({ description: 'Deliveries count by day of week' })
  deliveriesByDay: DeliveryCountByDay;

  @ApiProperty({ description: 'Top delivery persons by number of deliveries', type: [Object] })
  topDeliveryPersons: Array<{
    id: number;
    name: string;
    deliveries: number;
    rating: number;
  }>;

  @ApiProperty({ description: 'Statistics timestamp' })
  timestamp: Date;
}