import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
// Import global types - we removed the specific interface import and will use any for now
// to avoid path issues

interface RequestUser {
  id: number;
  roles: string[];
}

@ApiTags('admin/users')
@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of users with optional filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by user role' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for username, email, phone, or name' })
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
    @Query('search') search?: string
  ) {
    return this.userManagementService.getUsers(
      Number(page),
      Number(limit),
      role,
      search
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUserById(@Param('id') id: string) {
    return this.userManagementService.getUserById(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user (admin function)' })
  @ApiBody({ type: Object, description: 'User data' })
  async createUser(
    @Body() userData: any,
    @Req() req: { user: RequestUser }
  ) {
    return this.userManagementService.createUser(userData, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: Object, description: 'User data to update' })
  async updateUser(
    @Param('id') id: string,
    @Body() userData: any,
    @Req() req: { user: RequestUser }
  ) {
    return this.userManagementService.updateUser(Number(id), userData, req.user.id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a user\'s role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string' }
      },
      required: ['role']
    }
  })
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @Req() req: { user: RequestUser }
  ) {
    return this.userManagementService.updateUserRole(Number(id), role, req.user.id);
  }

  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable a user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' }
      }
    }
  })
  async disableUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: { user: RequestUser }
  ) {
    return this.userManagementService.disableUser(Number(id), req.user.id, reason);
  }

  @Patch(':id/enable')
  @ApiOperation({ summary: 'Enable a user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async enableUser(
    @Param('id') id: string,
    @Req() req: { user: RequestUser }
  ) {
    return this.userManagementService.enableUser(Number(id), req.user.id);
  }
}