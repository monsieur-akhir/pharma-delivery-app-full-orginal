import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserFilterDto,
  ChangePasswordDto,
  AssignRoleDto,
  UserStatsResponseDto
} from './dto/index';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with optional filtering' })
  @ApiResponse({ status: 200, description: 'Return all users', type: [UserResponseDto] })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'pharmacyId', required: false, description: 'Filter by pharmacy ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, email, or username' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @Roles('admin', 'pharmacy_admin')
  async findAll(@Query() filterDto: UserFilterDto, @Req() req) {
    return this.usersService.findAll(filterDto, req.user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return the current user profile', type: UserResponseDto })
  async getCurrentUser(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Return user statistics', type: UserStatsResponseDto })
  @Roles('admin', 'pharmacy_admin')
  async getStats(@Req() req) {
    return this.usersService.getStats(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Return the user', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles('admin', 'pharmacy_admin')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles('admin', 'pharmacy_admin')
  async create(@Body() createUserDto: CreateUserDto, @Req() req) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'The user has been updated', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles('admin', 'pharmacy_admin')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req) {
    return this.usersService.update(+id, updateUserDto, req.user);
  }

  @Put('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserResponseDto })
  async updateProfile(@Body() updateUserDto: UpdateUserDto, @Req() req) {
    return this.usersService.updateProfile(updateUserDto, req.user);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles('admin', 'pharmacy_admin')
  async updateStatus(
    @Param('id') id: string,
    @Body() statusData: { status: 'active' | 'inactive' | 'pending' | 'blocked' },
    @Req() req
  ) {
    return this.usersService.updateStatus(+id, statusData.status, req.user);
  }

  @Put(':id/assign-role')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles('admin')
  async assignRole(@Param('id') id: string, @Body() assignRoleDto: AssignRoleDto, @Req() req) {
    return this.usersService.assignRole(+id, assignRoleDto.role, req.user);
  }

  @Put(':id/assign-pharmacy')
  @ApiOperation({ summary: 'Assign pharmacy to user' })
  @ApiResponse({ status: 200, description: 'Pharmacy assigned successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles('admin', 'pharmacy_admin')
  async assignPharmacy(
    @Param('id') id: string,
    @Body() pharmacyData: { pharmacyId: number },
    @Req() req
  ) {
    return this.usersService.assignPharmacy(+id, pharmacyData.pharmacyId, req.user);
  }

  @Put('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'The user has been deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles('admin')
  async remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(+id, req.user);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password and send email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles('admin', 'pharmacy_admin')
  async resetPassword(@Param('id') id: string, @Req() req) {
    return this.usersService.resetPassword(+id, req.user);
  }
}