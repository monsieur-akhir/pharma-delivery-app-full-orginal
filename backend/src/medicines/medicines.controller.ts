// src/medicines/medicines.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MedicinesService } from './medicines.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateMedicineDto,
  UpdateMedicineDto,
  MedicineResponseDto,
  MedicineFilterDto,
} from './dto';

@ApiTags('medicines')
@Controller('medicines')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all medicines with optional filtering' })
  @ApiResponse({ status: 200, description: 'Return all medicines', type: [MedicineResponseDto] })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by medicine name' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'inStock', required: false, description: 'Filter by stock status (true or false)' })
  @ApiQuery({ name: 'pharmacyId', required: false, description: 'Filter by pharmacy ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async findAll(
    @Query() filterDto: MedicineFilterDto,
    @Req() req,
  ): Promise<MedicineResponseDto[]> {
    return this.medicinesService.findAll(filterDto, req.user);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all medicine categories' })
  @ApiResponse({ status: 200, description: 'Return all medicine categories', type: [String] })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async getCategories(): Promise<string[]> {
    return this.medicinesService.getCategories();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get medicines with low stock' })
  @ApiResponse({ status: 200, description: 'Return medicines with low stock', type: [MedicineResponseDto] })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async getLowStock(@Req() req): Promise<MedicineResponseDto[]> {
    return this.medicinesService.getLowStock(req.user);
  }

  @Get('expiring-soon')
  @ApiOperation({ summary: 'Get medicines expiring soon' })
  @ApiResponse({ status: 200, description: 'Return medicines expiring soon', type: [MedicineResponseDto] })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async getExpiringSoon(@Req() req): Promise<MedicineResponseDto[]> {
    return this.medicinesService.getExpiringSoon(req.user);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get medicines statistics' })
  @ApiResponse({ status: 200, description: 'Return medicines statistics' })
  @Roles('admin', 'pharmacy_admin')
  async getStatistics(@Req() req): Promise<any> {
    return this.medicinesService.getStatistics(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medicine by ID' })
  @ApiResponse({ status: 200, description: 'Return the medicine', type: MedicineResponseDto })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  @ApiParam({ name: 'id', description: 'Medicine ID', type: Number })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async findOne(@Param('id') id: string, @Req() req): Promise<MedicineResponseDto> {
    return this.medicinesService.findOne(+id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new medicine' })
  @ApiResponse({ status: 201, description: 'The medicine has been created', type: MedicineResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async create(
    @Body() createMedicineDto: CreateMedicineDto,
    @Req() req,
  ): Promise<MedicineResponseDto> {
    return this.medicinesService.create(createMedicineDto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a medicine' })
  @ApiResponse({ status: 200, description: 'The medicine has been updated', type: MedicineResponseDto })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  @ApiParam({ name: 'id', description: 'Medicine ID', type: Number })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async update(
    @Param('id') id: string,
    @Body() updateMedicineDto: UpdateMedicineDto,
    @Req() req,
  ): Promise<MedicineResponseDto> {
    return this.medicinesService.update(+id, updateMedicineDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a medicine' })
  @ApiResponse({ status: 200, description: 'The medicine has been deleted' })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  @ApiParam({ name: 'id', description: 'Medicine ID', type: Number })
  @Roles('admin', 'pharmacy_admin')
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    return this.medicinesService.remove(+id, req.user);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import medicines from file' })
  @ApiResponse({ status: 201, description: 'Medicines imported successfully' })
  @Roles('admin', 'pharmacy_admin')
  async importMedicines(@Body() importData: any[], @Req() req): Promise<any> {
    return this.medicinesService.importMedicines(importData, req.user);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export medicines to file' })
  @ApiResponse({ status: 200, description: 'Medicines exported successfully' })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async exportMedicines(
    @Query() filterDto: MedicineFilterDto,
    @Req() req,
  ): Promise<any> {
    return this.medicinesService.exportMedicines(filterDto, req.user);
  }

  @Post(':id/update-stock')
  @ApiOperation({ summary: 'Update medicine stock' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully', type: MedicineResponseDto })
  @ApiParam({ name: 'id', description: 'Medicine ID', type: Number })
  @Roles('admin', 'pharmacy_admin', 'pharmacist')
  async updateStock(
    @Param('id') id: string,
    @Body() stockData: { quantity: number; type: 'add' | 'remove' | 'set' },
    @Req() req,
  ): Promise<MedicineResponseDto> {
    return this.medicinesService.updateStock(+id, stockData, req.user);
  }
}