import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared/schema';
import { StockService } from './stock.service';
import {
  CreateStockDto,
  UpdateStockDto,
  AdjustStockDto,
  TransferStockDto,
  StockFilterDto
} from './dto';
import {
  MedicineStockResponseDto,
  StockAlertResponseDto,
  StockMovementResponseDto,
  StockListResponseDto,
  StockTransferResponseDto
} from './dto/stock-response.dto';

@ApiTags('Stock Management')
@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('pharmacy/:pharmacyId')
  @ApiOperation({ summary: 'Obtenir le stock d\'une pharmacie' })
  @ApiParam({ name: 'pharmacyId', description: 'ID de la pharmacie' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom de médicament' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean, description: 'Afficher uniquement les stocks faibles' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
  @ApiResponse({ status: 200, description: 'Stock récupéré avec succès', type: StockListResponseDto })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async getPharmacyStock(
    @Param('pharmacyId', ParseIntPipe) pharmacyId: number,
    @Query() filterDto: StockFilterDto,
    @Request() req: any
  ): Promise<StockListResponseDto> {
    // Check if user can access this pharmacy's stock
    if (req.user.role === UserRole.PHARMACY_MANAGER && req.user.pharmacyId !== pharmacyId) {
      throw new Error('Accès non autorisé à cette pharmacie');
    }

    return this.stockService.getPharmacyStock({ ...filterDto, pharmacyId });
  }

  @Post('pharmacy/:pharmacyId/medicine/:medicineId')
  @ApiOperation({ summary: 'Ajouter un médicament au stock d\'une pharmacie' })
  @ApiParam({ name: 'pharmacyId', description: 'ID de la pharmacie' })
  @ApiParam({ name: 'medicineId', description: 'ID du médicament' })
  @ApiResponse({ status: 201, description: 'Médicament ajouté au stock avec succès', type: MedicineStockResponseDto })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async addMedicineToStock(
    @Param('pharmacyId', ParseIntPipe) pharmacyId: number,
    @Param('medicineId', ParseIntPipe) medicineId: number,
    @Body() createStockDto: CreateStockDto,
    @Request() req: any
  ): Promise<MedicineStockResponseDto> {
    // Check if user can manage this pharmacy's stock
    if (req.user.role === UserRole.PHARMACY_MANAGER && req.user.pharmacyId !== pharmacyId) {
      throw new Error('Accès non autorisé à cette pharmacie');
    }

    return this.stockService.addMedicineToStock(pharmacyId, medicineId, createStockDto, req.user.id);
  }
  @Put(':stockId')
  @ApiOperation({ summary: 'Mettre à jour le stock d\'un médicament' })
  @ApiParam({ name: 'stockId', description: 'ID du stock' })
  @ApiResponse({ status: 200, description: 'Stock mis à jour avec succès', type: MedicineStockResponseDto })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async updateStock(
    @Param('stockId', ParseIntPipe) stockId: number,
    @Body() updateStockDto: UpdateStockDto,
    @Request() req: any
  ): Promise<MedicineStockResponseDto> {
    return this.stockService.updateStock(stockId, updateStockDto);
  }
  @Post(':stockId/adjust')
  @ApiOperation({ summary: 'Ajuster la quantité en stock' })
  @ApiParam({ name: 'stockId', description: 'ID du stock' })
  @ApiResponse({ status: 200, description: 'Stock ajusté avec succès', type: MedicineStockResponseDto })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async adjustStock(
    @Param('stockId', ParseIntPipe) stockId: number,
    @Body() adjustStockDto: AdjustStockDto,
    @Request() req: any
  ): Promise<StockMovementResponseDto> {
    return this.stockService.adjustStockQuantity(stockId, adjustStockDto, req.user.id);
  }
  @Post('transfer')
  @ApiOperation({ summary: 'Transférer du stock entre pharmacies' })
  @ApiResponse({ status: 200, description: 'Transfert effectué avec succès', type: StockTransferResponseDto })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async transferStock(
    @Body() transferStockDto: TransferStockDto,
    @Request() req: any
  ): Promise<StockTransferResponseDto> {
    return this.stockService.transferStock(transferStockDto.sourceStockId, transferStockDto, req.user.id);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Obtenir les alertes de stock faible' })
  @ApiQuery({ name: 'pharmacyId', required: false, type: Number, description: 'ID de la pharmacie (optionnel pour admin)' })
  @ApiResponse({ status: 200, description: 'Alertes récupérées avec succès', type: [StockAlertResponseDto] })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async getStockAlerts(
    @Query('pharmacyId') pharmacyId?: number,
    @Request() req?: any
  ): Promise<StockAlertResponseDto[]> {
    // For pharmacy managers, only show alerts for their pharmacy
    if (req.user.role === UserRole.PHARMACY_MANAGER) {
      pharmacyId = req.user.pharmacyId;
    }

    return this.stockService.getStockAlerts(pharmacyId);
  }

  @Get('pharmacy/:pharmacyId/movements')
  @ApiOperation({ summary: 'Obtenir l\'historique des mouvements de stock d\'une pharmacie' })
  @ApiParam({ name: 'pharmacyId', description: 'ID de la pharmacie' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'type', required: false, description: 'Type de mouvement (PURCHASE, SALE, ADJUSTMENT, etc.)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Date de début (format YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Date de fin (format YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Mouvements de stock récupérés avec succès', type: [StockMovementResponseDto] })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async getStockMovements(
    @Param('pharmacyId', ParseIntPipe) pharmacyId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req: any
  ) {
    // Check if user can access this pharmacy's stock movements
    if (req.user.role === UserRole.PHARMACY_MANAGER && req.user.pharmacyId !== pharmacyId) {
      throw new Error('Accès non autorisé à cette pharmacie');
    }

    return this.stockService.getStockMovements(pharmacyId, {
      page,
      limit,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
  }

  @Get('pharmacy/:pharmacyId/low-stock-report')
  @ApiOperation({ summary: 'Générer un rapport des médicaments en stock faible' })
  @ApiParam({ name: 'pharmacyId', description: 'ID de la pharmacie' })
  @ApiResponse({ status: 200, description: 'Rapport généré avec succès', type: [StockAlertResponseDto] })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async generateLowStockReport(
    @Param('pharmacyId', ParseIntPipe) pharmacyId: number,
    @Request() req: any
  ) {
    // Check if user can access this pharmacy's reports
    if (req.user.role === UserRole.PHARMACY_MANAGER && req.user.pharmacyId !== pharmacyId) {
      throw new Error('Accès non autorisé à cette pharmacie');
    }
    
    return this.stockService.generateLowStockReport(pharmacyId);
  }

  @Get('pharmacy/:pharmacyId/expiring-medicines-report')
  @ApiOperation({ summary: 'Générer un rapport des médicaments qui expirent bientôt' })
  @ApiParam({ name: 'pharmacyId', description: 'ID de la pharmacie' })
  @ApiQuery({ name: 'daysThreshold', required: false, type: Number, description: 'Nombre de jours pour le seuil d\'expiration (défaut: 90)' })
  @ApiResponse({ status: 200, description: 'Rapport généré avec succès', type: [StockAlertResponseDto] })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async generateExpiringMedicinesReport(
    @Param('pharmacyId', ParseIntPipe) pharmacyId: number,
    @Query('daysThreshold') daysThreshold = 90,
    @Request() req: any
  ) {
    // Check if user can access this pharmacy's reports
    if (req.user.role === UserRole.PHARMACY_MANAGER && req.user.pharmacyId !== pharmacyId) {
      throw new Error('Accès non autorisé à cette pharmacie');
    }
    
    return this.stockService.generateExpiringMedicinesReport(pharmacyId, daysThreshold);
  }

  @Get('pharmacy/:pharmacyId/summary')
  @ApiOperation({ summary: 'Obtenir un résumé du stock d\'une pharmacie' })
  @ApiParam({ name: 'pharmacyId', description: 'ID de la pharmacie' })
  @ApiResponse({ status: 200, description: 'Résumé généré avec succès' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACY_MANAGER)
  async getStockSummary(
    @Param('pharmacyId', ParseIntPipe) pharmacyId: number,
    @Request() req: any
  ) {
    // Check if user can access this pharmacy's summary
    if (req.user.role === UserRole.PHARMACY_MANAGER && req.user.pharmacyId !== pharmacyId) {
      throw new Error('Accès non autorisé à cette pharmacie');
    }
    
    return this.stockService.getStockSummary(pharmacyId);
  }
}
