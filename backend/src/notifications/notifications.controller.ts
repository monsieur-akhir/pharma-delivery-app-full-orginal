import { Controller, Get, Post, Body, Param, Query, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  NotificationResponseDto, 
  NotificationFilterDto,
  SendNotificationDto,
  NotificationPreferencesDto 
} from './dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Return user notifications', type: [NotificationResponseDto] })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
  @ApiQuery({ name: 'read', required: false, description: 'Filter by read status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  async findAll(@Query() filterDto: NotificationFilterDto, @Req() req) {
    return this.notificationsService.findAll(filterDto, req.user);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({ status: 200, description: 'Return unread notification count' })
  async getUnreadCount(@Req() req) {
    return this.notificationsService.getUnreadCount(req.user);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all notification types' })
  @ApiResponse({ status: 200, description: 'Return notification types' })
  async getNotificationTypes() {
    return this.notificationsService.getNotificationTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Return the notification', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async findOne(@Param('id') id: string, @Req() req) {
    return this.notificationsService.findOne(+id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'The notification has been created', type: NotificationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles('admin', 'pharmacy_admin')
  async create(@Body() createNotificationDto: CreateNotificationDto, @Req() req) {
    return this.notificationsService.create(createNotificationDto, req.user);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a notification to users' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles('admin', 'pharmacy_admin')
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto, @Req() req) {
    return this.notificationsService.sendNotification(sendNotificationDto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({ status: 200, description: 'The notification has been updated', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @Roles('admin', 'pharmacy_admin')
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto, @Req() req) {
    return this.notificationsService.update(+id, updateNotificationDto, req.user);
  }

  @Put(':id/mark-as-read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationsService.markAsRead(+id, req.user);
  }

  @Put('mark-all-as-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'The notification has been deleted' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.notificationsService.remove(+id, req.user);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Return user notification preferences' })
  async getPreferences(@Req() req) {
    return this.notificationsService.getPreferences(req.user);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async updatePreferences(@Body() preferencesDto: NotificationPreferencesDto, @Req() req) {
    return this.notificationsService.updatePreferences(preferencesDto, req.user);
  }
}