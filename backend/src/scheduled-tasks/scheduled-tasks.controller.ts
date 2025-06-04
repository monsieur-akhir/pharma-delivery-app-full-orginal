import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('scheduled-tasks')
@Controller('scheduled-tasks')
// Auth guards temporarily disabled for testing
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class ScheduledTasksController {
  constructor(private readonly scheduledTasksService: ScheduledTasksService) {}

  @Get('status')
  // @Roles('ADMIN') // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get status of scheduled tasks' })
  @ApiResponse({
    status: 200,
    description: 'Returns the status of scheduled tasks',
  })
  getStatus() {
    return {
      status: 'active',
      tasks: [
        { name: 'checkLowStockMedicines', schedule: 'daily at 1:00 AM' },
        { name: 'processReminders', schedule: 'every 15 minutes' },
        { name: 'checkInactiveOrders', schedule: 'hourly' },
      ],
    };
  }

  @Post('run/check-low-stock')
  // @Roles('ADMIN', 'PHARMACY_STAFF') // Temporarily disabled for testing
  @ApiOperation({ summary: 'Manually trigger low stock check' })
  @ApiResponse({
    status: 200,
    description: 'Low stock check triggered successfully',
  })
  async triggerLowStockCheck() {
    try {
      await this.scheduledTasksService.checkLowStockMedicines();
      return {
        status: 'success',
        message: 'Low stock check triggered successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('run/process-reminders')
  // @Roles('ADMIN') // Temporarily disabled for testing
  @ApiOperation({ summary: 'Manually trigger reminder processing' })
  @ApiResponse({
    status: 200,
    description: 'Reminder processing triggered successfully',
  })
  async triggerReminderProcessing() {
    try {
      await this.scheduledTasksService.processReminders();
      return {
        status: 'success',
        message: 'Reminder processing triggered successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('run/check-inactive-orders')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Manually trigger inactive orders check' })
  @ApiResponse({
    status: 200,
    description: 'Inactive orders check triggered successfully',
  })
  async triggerInactiveOrdersCheck() {
    try {
      await this.scheduledTasksService.checkInactiveOrders();
      return {
        status: 'success',
        message: 'Inactive orders check triggered successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}