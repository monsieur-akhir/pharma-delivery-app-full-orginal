import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { RecordMedicationDto } from './dto/record-medication.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('reminders')
@Controller('api/reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reminders' })
  @ApiResponse({ status: 200, description: 'Returns all reminders' })
  async findAll() {
    return this.remindersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reminder by ID' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Returns a single reminder' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async findOne(@Param('id') id: string) {
    const reminder = await this.remindersService.findById(Number(id));
    if (!reminder) {
      return { status: 'error', message: 'Reminder not found' };
    }
    return { status: 'success', data: reminder };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reminders for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns reminders for the user' })
  async getUserReminders(@Param('userId') userId: string) {
    const reminders = await this.remindersService.findByUser(Number(userId));
    return { status: 'success', data: reminders };
  }

  @Get('user/:userId/active')
  @ApiOperation({ summary: 'Get active reminders for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns active reminders for the user' })
  async getActiveUserReminders(@Param('userId') userId: string) {
    const reminders = await this.remindersService.findActiveByUser(Number(userId));
    return { status: 'success', data: reminders };
  }

  @Get('user/:userId/due')
  @ApiOperation({ summary: 'Get due reminders for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Due date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns due reminders for the user' })
  async getDueReminders(
    @Param('userId') userId: string,
    @Query('date') dateStr?: string
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const reminders = await this.remindersService.findDueReminders(Number(userId), date);
    return { status: 'success', data: reminders };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new reminder' })
  @ApiResponse({ status: 201, description: 'Reminder created successfully' })
  async create(@Body() createReminderDto: CreateReminderDto) {
    try {
      const reminder = await this.remindersService.create({
        userId: createReminderDto.userId,
        medicineName: createReminderDto.medicineName,
        medicineId: createReminderDto.medicineId,
        dosage: createReminderDto.dosage,
        schedule: createReminderDto.schedule,
        startDate: createReminderDto.startDate,
        endDate: createReminderDto.endDate,
        isActive: createReminderDto.isActive,
      });
      
      return { status: 'success', data: reminder };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a reminder' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Reminder updated successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async update(@Param('id') id: string, @Body() updateReminderDto: UpdateReminderDto) {
    try {
      const reminder = await this.remindersService.update(Number(id), {
        medicineName: updateReminderDto.medicineName,
        medicineId: updateReminderDto.medicineId,
        dosage: updateReminderDto.dosage,
        schedule: updateReminderDto.schedule,
        startDate: updateReminderDto.startDate,
        endDate: updateReminderDto.endDate,
        isActive: updateReminderDto.isActive,
      });
      
      if (!reminder) {
        return { status: 'error', message: 'Reminder not found' };
      }
      
      return { status: 'success', data: reminder };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post(':id/record')
  @ApiOperation({ summary: 'Record medication taken' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Medication recorded successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async recordMedication(
    @Param('id') id: string,
    @Body() recordMedicationDto: RecordMedicationDto
  ) {
    try {
      // Verify if the reminder exists
      const reminder = await this.remindersService.findById(Number(id));
      if (!reminder) {
        return { status: 'error', message: 'Reminder not found' };
      }
      
      // Record medication
      const takenAt = new Date(recordMedicationDto.takenAt);
      const updatedReminder = await this.remindersService.recordMedication(Number(id), takenAt);
      
      return { status: 'success', data: updatedReminder };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Reminder deleted successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async remove(@Param('id') id: string) {
    try {
      const deleted = await this.remindersService.delete(Number(id));
      
      if (!deleted) {
        return { status: 'error', message: 'Reminder not found' };
      }
      
      return { status: 'success', message: 'Reminder deleted successfully' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}