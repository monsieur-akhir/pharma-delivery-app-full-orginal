import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards, Req, Post } from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

interface RequestUser {
  id: number;
  roles: string[];
}

@ApiTags('admin/ai-settings')
@Controller('api/admin/ai-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AiSettingsController {
  constructor(private readonly aiSettingsService: AiSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all AI settings' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'pharmacyId', required: false, type: Number })
  async getAllSettings(
    @Query('userId') userId?: string,
    @Query('pharmacyId') pharmacyId?: string
  ) {
    return this.aiSettingsService.getAllSettings(
      userId ? Number(userId) : undefined,
      pharmacyId ? Number(pharmacyId) : undefined
    );
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a specific AI setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'pharmacyId', required: false, type: Number })
  async getSetting(
    @Param('key') key: string,
    @Query('userId') userId?: string,
    @Query('pharmacyId') pharmacyId?: string
  ) {
    return this.aiSettingsService.getSetting(
      key,
      userId ? Number(userId) : undefined,
      pharmacyId ? Number(pharmacyId) : undefined
    );
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update or create an AI setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'pharmacyId', required: false, type: Number })
  async updateSetting(
    @Param('key') key: string,
    @Body() body: any,
    @Req() req: { user: RequestUser },
    @Query('userId') userId?: string,
    @Query('pharmacyId') pharmacyId?: string
  ) {
    return this.aiSettingsService.updateSetting(
      key,
      body,
      req.user.id,
      userId ? Number(userId) : undefined,
      pharmacyId ? Number(pharmacyId) : undefined
    );
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete an AI setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'pharmacyId', required: false, type: Number })
  async deleteSetting(
    @Param('key') key: string,
    @Req() req: { user: RequestUser },
    @Query('userId') userId?: string,
    @Query('pharmacyId') pharmacyId?: string
  ) {
    return this.aiSettingsService.deleteSetting(
      key,
      req.user.id,
      userId ? Number(userId) : undefined,
      pharmacyId ? Number(pharmacyId) : undefined
    );
  }

  @Post(':key/reset')
  @ApiOperation({ summary: 'Reset an AI setting to default value' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'pharmacyId', required: false, type: Number })
  async resetToDefault(
    @Param('key') key: string,
    @Req() req: { user: RequestUser },
    @Query('userId') userId?: string,
    @Query('pharmacyId') pharmacyId?: string
  ) {
    return this.aiSettingsService.resetToDefault(
      key,
      req.user.id,
      userId ? Number(userId) : undefined,
      pharmacyId ? Number(pharmacyId) : undefined
    );
  }
}