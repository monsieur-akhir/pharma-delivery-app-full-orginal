import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SystemLog, CreateSystemLogDto } from '../../interfaces/system-log.interface';

@ApiTags('admin/system-logs')
@Controller('api/admin/system-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated system logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'filter', required: false, type: String })
  async getLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('filter') filter?: string,
  ) {
    return this.systemLogsService.getLogs(Number(page), Number(limit), filter);
  }

  @Get('entity/:type/:id')
  @ApiOperation({ summary: 'Get logs for a specific entity' })
  @ApiParam({ name: 'type', description: 'Entity type (e.g., user, pharmacy, order)' })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  async getEntityLogs(
    @Param('type') entityType: string,
    @Param('id') entityId: string,
  ) {
    return this.systemLogsService.getEntityLogs(entityType, Number(entityId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new system log entry' })
  async createLog(@Body() logEntry: CreateSystemLogDto) {
    return this.systemLogsService.createLogEntry(logEntry);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Delete logs older than specified days' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to keep logs' })
  async cleanupLogs(@Query('days') days = 90) {
    const count = await this.systemLogsService.deleteOldLogs(Number(days));
    return { message: `Successfully deleted ${count} log entries older than ${days} days` };
  }
}