import { ApiProperty } from '@nestjs/swagger';

export class UserStatsResponseDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers!: number;

  @ApiProperty({ description: 'User counts by role', type: 'object', additionalProperties: { type: 'number' }})
  byRole!: Record<string, number>;

  @ApiProperty({ description: 'User counts by status', type: 'object', additionalProperties: { type: 'number' }})
  byStatus!: Record<string, number>;
}
