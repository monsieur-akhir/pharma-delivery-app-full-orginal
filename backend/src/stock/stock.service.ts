import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, and, ilike, lt, desc, asc, count, sql, inArray } from 'drizzle-orm';
import {
  pharmacy_medicines,
  medicines, 
  pharmacies, 
  users,
  stock_movements
} from '@shared/schema';
import {
  CreateStockDto,
  UpdateStockDto,
  AdjustStockDto,
  TransferStockDto,
  StockFilterDto,
  StockChangeReason
} from './dto';
import {
  MedicineStockResponseDto,
  StockAlertResponseDto,
  StockMovementResponseDto,
  StockListResponseDto,
  StockTransferResponseDto
} from './dto/stock-response.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private async logStockMovement(
    pharmacyId: number,
    medicineId: number,
    movementType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'EXPIRED' | 'DAMAGED' | 'RETURNED',
    quantity: number,
    previousStock: number,
    newStock: number,
    performedBy: number,
    unitPrice?: number,
    referenceId?: number,
    referenceType?: string,
    notes?: string
  ): Promise<void> {
    try {
      const totalValue = unitPrice ? Math.abs(quantity) * unitPrice : null;
      
      await this.databaseService.db.insert(stock_movements).values({
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        movement_type: movementType,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        unit_price: unitPrice?.toString(),
        total_value: totalValue?.toString(),
        reference_id: referenceId,
        reference_type: referenceType,
        notes,
        performed_by: performedBy,
      });

      this.logger.log(
        `Stock movement logged: Pharmacy ${pharmacyId}, Medicine ${medicineId}, Type: ${movementType}, Qty: ${quantity}, ${previousStock} -> ${newStock}`
      );
    } catch (error) {
      this.logger.error('Failed to log stock movement:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getPharmacyStock(filterDto: StockFilterDto): Promise<StockListResponseDto> {
    const { pharmacyId, search, category, lowStock, page = 1, limit = 10 } = filterDto;
    
    if (!pharmacyId) {
      throw new BadRequestException('Pharmacy ID is required');
    }

    const offset = (page - 1) * limit;

    let baseQuery = this.databaseService.db
      .select({
        id: pharmacy_medicines.id,
        medicineId: pharmacy_medicines.medicine_id,
        pharmacyId: pharmacy_medicines.pharmacy_id,
        quantity: pharmacy_medicines.stock,
        reorderLevel: pharmacy_medicines.reorder_threshold,
        idealStock: pharmacy_medicines.optimal_stock,
        lastUpdated: pharmacy_medicines.updated_at,
        price: pharmacy_medicines.price,
        // Medicine info
        medicineName: medicines.name,
        genericName: medicines.generic_name,
        medicineCategory: medicines.category,
        manufacturer: medicines.manufacturer,
        imageUrl: medicines.image_url,
        // Pharmacy info
        pharmacyName: pharmacies.name,
        pharmacyAddress: pharmacies.address,
      })
      .from(pharmacy_medicines)
      .innerJoin(medicines, eq(pharmacy_medicines.medicine_id, medicines.id))
      .innerJoin(pharmacies, eq(pharmacy_medicines.pharmacy_id, pharmacies.id))
      .where(eq(pharmacy_medicines.pharmacy_id, pharmacyId));

    // Apply filters
    const conditions = [eq(pharmacy_medicines.pharmacy_id, pharmacyId)];

    if (search) {
      conditions.push(
        ilike(medicines.name, `%${search}%`)
      );
    }

    if (category) {
      conditions.push(eq(medicines.category, category));
    }

    if (lowStock) {
      conditions.push(
        lt(pharmacy_medicines.stock, pharmacy_medicines.reorder_threshold)
      );
    }

    // Get total count
    const totalResult = await this.databaseService.db
      .select({ count: count() })
      .from(pharmacy_medicines)
      .innerJoin(medicines, eq(pharmacy_medicines.medicine_id, medicines.id))
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // Get paginated data
    const stockData = await this.databaseService.db
      .select({
        id: pharmacy_medicines.id,
        medicineId: pharmacy_medicines.medicine_id,
        pharmacyId: pharmacy_medicines.pharmacy_id,
        quantity: pharmacy_medicines.stock,
        reorderLevel: pharmacy_medicines.reorder_threshold,
        idealStock: pharmacy_medicines.optimal_stock,
        lastUpdated: pharmacy_medicines.updated_at,
        price: pharmacy_medicines.price,
        // Medicine info
        medicineName: medicines.name,
        genericName: medicines.generic_name,
        medicineCategory: medicines.category,
        manufacturer: medicines.manufacturer,
        imageUrl: medicines.image_url,
        // Pharmacy info
        pharmacyName: pharmacies.name,
        pharmacyAddress: pharmacies.address,
      })
      .from(pharmacy_medicines)
      .innerJoin(medicines, eq(pharmacy_medicines.medicine_id, medicines.id))
      .innerJoin(pharmacies, eq(pharmacy_medicines.pharmacy_id, pharmacies.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(asc(medicines.name));

    const stock: MedicineStockResponseDto[] = stockData.map(item => ({
      id: item.id,
      medicineId: item.medicineId,
      pharmacyId: item.pharmacyId,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel || 5,
      idealStock: item.idealStock || 20,
      lastUpdated: item.lastUpdated,
      medicine: {
        id: item.medicineId,
        name: item.medicineName,
        genericName: item.genericName || '',
        category: item.medicineCategory || '',
        manufacturer: item.manufacturer || '',
        imageUrl: item.imageUrl || undefined,
      },
      pharmacy: {
        id: item.pharmacyId,
        name: item.pharmacyName,
        address: item.pharmacyAddress,
      },
    }));

    return {
      stock,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStockById(stockId: number): Promise<MedicineStockResponseDto> {
    const stockData = await this.databaseService.db
      .select({
        id: pharmacy_medicines.id,
        medicineId: pharmacy_medicines.medicine_id,
        pharmacyId: pharmacy_medicines.pharmacy_id,
        quantity: pharmacy_medicines.stock,
        reorderLevel: pharmacy_medicines.reorder_threshold,
        idealStock: pharmacy_medicines.optimal_stock,
        lastUpdated: pharmacy_medicines.updated_at,
        price: pharmacy_medicines.price,
        // Medicine info
        medicineName: medicines.name,
        genericName: medicines.generic_name,
        medicineCategory: medicines.category,
        manufacturer: medicines.manufacturer,
        imageUrl: medicines.image_url,
        // Pharmacy info
        pharmacyName: pharmacies.name,
        pharmacyAddress: pharmacies.address,
      })
      .from(pharmacy_medicines)
      .innerJoin(medicines, eq(pharmacy_medicines.medicine_id, medicines.id))
      .innerJoin(pharmacies, eq(pharmacy_medicines.pharmacy_id, pharmacies.id))
      .where(eq(pharmacy_medicines.id, stockId))
      .limit(1);

    if (!stockData.length) {
      throw new NotFoundException('Stock not found');
    }

    const item = stockData[0];
    return {
      id: item.id,
      medicineId: item.medicineId,
      pharmacyId: item.pharmacyId,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel || 5,
      idealStock: item.idealStock || 20,
      lastUpdated: item.lastUpdated,
      medicine: {
        id: item.medicineId,
        name: item.medicineName,
        genericName: item.genericName || '',
        category: item.medicineCategory || '',
        manufacturer: item.manufacturer || '',
        imageUrl: item.imageUrl || undefined,
      },
      pharmacy: {
        id: item.pharmacyId,
        name: item.pharmacyName,
        address: item.pharmacyAddress,
      },
    };
  }
  async addMedicineToStock(
    pharmacyId: number,
    medicineId: number,
    stockData: CreateStockDto,
    userId: number
  ): Promise<MedicineStockResponseDto> {
    // Check if medicine exists
    const medicine = await this.databaseService.db
      .select()
      .from(medicines)
      .where(eq(medicines.id, medicineId))
      .limit(1);

    if (!medicine.length) {
      throw new NotFoundException('Medicine not found');
    }

    // Check if pharmacy exists
    const pharmacy = await this.databaseService.db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);

    if (!pharmacy.length) {
      throw new NotFoundException('Pharmacy not found');
    }

    // Check if this medicine is already in stock for this pharmacy
    const existingStock = await this.databaseService.db
      .select()
      .from(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          eq(pharmacy_medicines.medicine_id, medicineId)
        )
      )
      .limit(1);

    if (existingStock.length) {
      throw new BadRequestException('Medicine already exists in pharmacy stock');
    }    // Add medicine to stock
    const [newStock] = await this.databaseService.db
      .insert(pharmacy_medicines)
      .values({
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        stock: stockData.quantity,
        reorder_threshold: stockData.reorderLevel,
        optimal_stock: stockData.idealStock,
        price: medicine[0].price || '0',
        updated_at: new Date(),
      })
      .returning({ id: pharmacy_medicines.id });

    // Log the stock movement
    await this.logStockMovement(
      pharmacyId,
      medicineId,
      'PURCHASE',
      stockData.quantity,
      0,
      stockData.quantity,
      userId,
      parseFloat(medicine[0].price || '0'),
      undefined,
      'initial_stock',
      'Medicine added to pharmacy stock'
    );

    this.logger.log(`Added medicine ${medicineId} to pharmacy ${pharmacyId} stock`);

    return this.getStockById(newStock.id);
  }

  async updateStock(stockId: number, stockData: UpdateStockDto): Promise<MedicineStockResponseDto> {
    const existingStock = await this.getStockById(stockId);

    const updateData: any = {
      updated_at: new Date(),
    };

    if (stockData.quantity !== undefined) {
      updateData.stock = stockData.quantity;
    }
    if (stockData.reorderLevel !== undefined) {
      updateData.reorder_threshold = stockData.reorderLevel;
    }
    if (stockData.idealStock !== undefined) {
      updateData.optimal_stock = stockData.idealStock;
    }

    await this.databaseService.db
      .update(pharmacy_medicines)
      .set(updateData)
      .where(eq(pharmacy_medicines.id, stockId));

    this.logger.log(`Updated stock ${stockId}`);

    return this.getStockById(stockId);
  }

  async removeStock(stockId: number): Promise<void> {
    const existingStock = await this.getStockById(stockId);

    await this.databaseService.db
      .delete(pharmacy_medicines)
      .where(eq(pharmacy_medicines.id, stockId));

    this.logger.log(`Removed stock ${stockId}`);
  }
  async adjustStockQuantity(
    stockId: number,
    adjustData: AdjustStockDto,
    userId: number
  ): Promise<StockMovementResponseDto> {
    const existingStock = await this.getStockById(stockId);
    const previousQuantity = existingStock.quantity;
    
    // Update the stock quantity
    await this.databaseService.db
      .update(pharmacy_medicines)
      .set({
        stock: adjustData.quantity,
        updated_at: new Date(),
      })
      .where(eq(pharmacy_medicines.id, stockId));

    // Log the stock movement
    await this.logStockMovement(
      existingStock.pharmacyId,
      existingStock.medicineId,
      'ADJUSTMENT',
      adjustData.quantity - previousQuantity,
      previousQuantity,
      adjustData.quantity,
      userId,
      undefined, // unit price not available for adjustments
      undefined, // no reference ID
      'adjustment',
      adjustData.notes
    );

    return {
      id: Date.now(), // Mock ID for compatibility
      medicineStockId: stockId,
      previousQuantity,
      newQuantity: adjustData.quantity,
      changeReason: adjustData.reason,
      notes: adjustData.notes,
      timestamp: new Date(),
      createdBy: `User ${userId}`,
      medicineStock: await this.getStockById(stockId),
    };
  }

  async getStockAlerts(pharmacyId?: number): Promise<StockAlertResponseDto[]> {
    let whereConditions = [
      lt(pharmacy_medicines.stock, pharmacy_medicines.reorder_threshold)
    ];

    if (pharmacyId) {
      whereConditions.push(eq(pharmacy_medicines.pharmacy_id, pharmacyId));
    }

    const lowStockItems = await this.databaseService.db
      .select({
        medicineId: medicines.id,
        medicineName: medicines.name,
        genericName: medicines.generic_name,
        pharmacyId: pharmacies.id,
        pharmacyName: pharmacies.name,
        currentQuantity: pharmacy_medicines.stock,
        reorderLevel: pharmacy_medicines.reorder_threshold,
      })
      .from(pharmacy_medicines)
      .innerJoin(medicines, eq(pharmacy_medicines.medicine_id, medicines.id))
      .innerJoin(pharmacies, eq(pharmacy_medicines.pharmacy_id, pharmacies.id))
      .where(and(...whereConditions))
      .orderBy(asc(medicines.name));

    return lowStockItems.map(item => ({
      type: 'LOW' as const,
      medicine: {
        id: item.medicineId,
        name: item.medicineName,
        genericName: item.genericName || '',
      },
      pharmacy: {
        id: item.pharmacyId,
        name: item.pharmacyName,
      },
      currentQuantity: item.currentQuantity,
      reorderLevel: item.reorderLevel || 5,
    }));
  }

  async transferStock(
    sourceStockId: number,
    transferData: TransferStockDto,
    userId: number
  ): Promise<StockTransferResponseDto> {
    const sourceStock = await this.getStockById(sourceStockId);
    
    if (sourceStock.quantity < transferData.quantity) {
      throw new BadRequestException('Insufficient stock for transfer');
    }

    // Check if destination pharmacy has this medicine in stock
    const destinationStock = await this.databaseService.db
      .select()
      .from(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, transferData.destinationPharmacyId),
          eq(pharmacy_medicines.medicine_id, sourceStock.medicineId)
        )
      )
      .limit(1);

    // Update source stock
    const newSourceQuantity = sourceStock.quantity - transferData.quantity;
    await this.databaseService.db
      .update(pharmacy_medicines)
      .set({
        stock: newSourceQuantity,
        updated_at: new Date(),
      })
      .where(eq(pharmacy_medicines.id, sourceStockId));

    let destinationStockId: number;    if (destinationStock.length) {
      // Update existing destination stock
      destinationStockId = destinationStock[0].id;
      const oldDestinationQuantity = destinationStock[0].stock;
      const newDestinationQuantity = oldDestinationQuantity + transferData.quantity;
      
      await this.databaseService.db
        .update(pharmacy_medicines)
        .set({
          stock: newDestinationQuantity,
          updated_at: new Date(),
        })
        .where(eq(pharmacy_medicines.id, destinationStockId));
      
      // Log destination stock movement
      await this.logStockMovement(
        transferData.destinationPharmacyId,
        sourceStock.medicineId,
        'TRANSFER_IN',
        transferData.quantity,
        oldDestinationQuantity,
        newDestinationQuantity,
        userId,
        undefined, // unit price not available
        sourceStockId,
        'transfer',
        transferData.notes
      );
    } else {
      // Create new stock entry for destination pharmacy
      const [newDestinationStock] = await this.databaseService.db
        .insert(pharmacy_medicines)
        .values({
          pharmacy_id: transferData.destinationPharmacyId,
          medicine_id: sourceStock.medicineId,
          stock: transferData.quantity,
          reorder_threshold: sourceStock.reorderLevel,
          optimal_stock: sourceStock.idealStock,
          price: sourceStock.medicine?.name ? '0' : '0', // Would need to get proper price
          updated_at: new Date(),
        })
        .returning({ id: pharmacy_medicines.id });
      
      destinationStockId = newDestinationStock.id;
      
      // Log destination stock movement (new stock created)
      await this.logStockMovement(
        transferData.destinationPharmacyId,
        sourceStock.medicineId,
        'TRANSFER_IN',
        transferData.quantity,
        0,
        transferData.quantity,
        userId,
        undefined, // unit price not available
        sourceStockId,
        'transfer',
        transferData.notes
      );
    }

    // Log source stock movement
    await this.logStockMovement(
      sourceStock.pharmacyId,
      sourceStock.medicineId,
      'TRANSFER_OUT',
      -transferData.quantity,
      sourceStock.quantity,
      newSourceQuantity,
      userId,
      undefined, // unit price not available
      destinationStockId,
      'transfer',
      transferData.notes
    );

    this.logger.log(
      `Transferred ${transferData.quantity} units from stock ${sourceStockId} to pharmacy ${transferData.destinationPharmacyId}`
    );

    return {
      source: await this.getStockById(sourceStockId),
      destination: await this.getStockById(destinationStockId),
      message: `Successfully transferred ${transferData.quantity} units`,
    };
  }  async getStockMovements(pharmacyId: number, options?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    medicineId?: number;
  }) {
    const {
      page = 1,
      limit = 20,
      type,
      startDate,
      endDate,
      medicineId
    } = options || {};
    
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [eq(stock_movements.pharmacy_id, pharmacyId)];
    
    // Add optional filters
    if (type) {
      conditions.push(eq(stock_movements.movement_type, type));
    }
    
    if (startDate) {
      conditions.push(sql`${stock_movements.created_at} >= ${startDate}`);
    }
    
    if (endDate) {
      // Add one day to include the entire end date
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      conditions.push(sql`${stock_movements.created_at} < ${nextDay}`);
    }
    
    if (medicineId) {
      conditions.push(eq(stock_movements.medicine_id, medicineId));
    }
    
    // Query stock movements for this pharmacy
    const movements = await this.databaseService.db
      .select({
        id: stock_movements.id,
        movementType: stock_movements.movement_type,
        quantity: stock_movements.quantity,
        previousStock: stock_movements.previous_stock,
        newStock: stock_movements.new_stock,
        unitPrice: stock_movements.unit_price,
        totalValue: stock_movements.total_value,
        referenceId: stock_movements.reference_id,
        referenceType: stock_movements.reference_type,
        notes: stock_movements.notes,
        createdAt: stock_movements.created_at,
        medicineId: stock_movements.medicine_id,
        medicineName: medicines.name,
        // User info
        performedByName: users.username,
        performedByEmail: users.email,
      })      .from(stock_movements)
      .leftJoin(users, eq(stock_movements.performed_by, users.id))
      .leftJoin(medicines, eq(stock_movements.medicine_id, medicines.id))
      .where(and(...conditions))
      .orderBy(desc(stock_movements.created_at))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count: totalCount }] = await this.databaseService.db
      .select({ count: count() })
      .from(stock_movements)
      .where(and(...conditions));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      movements: movements.map(movement => ({
        id: movement.id,
        movementType: movement.movementType,
        quantity: movement.quantity,
        previousStock: movement.previousStock,
        newStock: movement.newStock,
        unitPrice: movement.unitPrice ? parseFloat(movement.unitPrice) : null,
        totalValue: movement.totalValue ? parseFloat(movement.totalValue) : null,
        referenceId: movement.referenceId,
        referenceType: movement.referenceType,
        notes: movement.notes,
        createdAt: movement.createdAt,
        performedBy: {
          name: movement.performedByName,
          email: movement.performedByEmail,
        },
      })),
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async generateStockReport(pharmacyId: number, format: 'pdf' | 'csv' = 'pdf'): Promise<Buffer> {
    // This would generate an actual report
    // For now, return a mock buffer
    const reportData = `Stock Report for Pharmacy ${pharmacyId}\nGenerated on: ${new Date().toISOString()}\n`;
    return Buffer.from(reportData, 'utf-8');
  }

  /**
   * Génère un rapport des médicaments en stock faible pour une pharmacie
   */
  async generateLowStockReport(pharmacyId: number): Promise<StockAlertResponseDto[]> {
    // Vérifier si la pharmacie existe
    const pharmacy = await this.databaseService.db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);
    
    if (pharmacy.length === 0) {
      throw new NotFoundException(`Pharmacie avec ID ${pharmacyId} non trouvée`);
    }
    
    // Obtenir tous les médicaments avec un stock inférieur au seuil d'alerte
    const lowStockItems = await this.databaseService.db
      .select({
        id: pharmacy_medicines.id,
        medicineId: pharmacy_medicines.medicine_id,
        medicineName: medicines.name,
        medicineDescription: medicines.description,
        currentStock: pharmacy_medicines.quantity,
        alertThreshold: pharmacy_medicines.alert_threshold,
        reorderLevel: pharmacy_medicines.reorder_level,
        expiryDate: pharmacy_medicines.expiry_date,
        unitPrice: pharmacy_medicines.unit_price,
        locationInPharmacy: pharmacy_medicines.location_in_pharmacy,
        updatedAt: pharmacy_medicines.updated_at,
      })
      .from(pharmacy_medicines)
      .innerJoin(medicines, eq(pharmacy_medicines.medicine_id, medicines.id))
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          sql`${pharmacy_medicines.quantity} <= ${pharmacy_medicines.alert_threshold}`,
          // Ne pas inclure les stocks à zéro (ils peuvent être traités séparément)
          sql`${pharmacy_medicines.quantity} > 0`
        )
      )
      .orderBy(asc(pharmacy_medicines.quantity));
      
    return lowStockItems.map(item => ({
      id: item.id,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      medicineDescription: item.medicineDescription || '',
      currentStock: item.currentStock,
      alertThreshold: item.alertThreshold,
      reorderLevel: item.reorderLevel,
      deficitAmount: item.reorderLevel - item.currentStock,
      expiryDate: item.expiryDate,
      unitPrice: item.unitPrice,
      totalValue: item.currentStock * item.unitPrice,
      locationInPharmacy: item.locationInPharmacy || '',
      alertType: 'LOW_STOCK',
      updatedAt: item.updatedAt,
    }));
  }

  /**
   * Génère un rapport des médicaments qui expirent bientôt
   */
  async generateExpiringMedicinesReport(pharmacyId: number, daysThreshold = 90): Promise<StockAlertResponseDto[]> {
    // Vérifier si la pharmacie existe
    const pharmacy = await this.databaseService.db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);
    
    if (pharmacy.length === 0) {
      throw new NotFoundException(`Pharmacie avec ID ${pharmacyId} non trouvée`);
    }
    
    // Calculer la date limite d'expiration (aujourd'hui + le nombre de jours du seuil)
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    // Obtenir tous les médicaments qui expirent avant la date limite
    const expiringItems = await this.databaseService.db
      .select({
        id: pharmacy_medicines.id,
        medicineId: pharmacy_medicines.medicine_id,
        medicineName: medicines.name,
        medicineDescription: medicines.description,
        currentStock: pharmacy_medicines.quantity,
        alertThreshold: pharmacy_medicines.alert_threshold,
        reorderLevel: pharmacy_medicines.reorder_level,
        expiryDate: pharmacy_medicines.expiry_date,
        unitPrice: pharmacy_medicines.unit_price,
        locationInPharmacy: pharmacy_medicines.location_in_pharmacy,
        updatedAt: pharmacy_medicines.updated_at,
      })
      .from(pharmacy_medicines)
      .innerJoin(medicines, eq(pharmacy_medicines.medicine_id, medicines.id))
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          // Ne considérer que les stocks non vides
          sql`${pharmacy_medicines.quantity} > 0`,
          // Médicaments qui expirent avant la date limite
          sql`${pharmacy_medicines.expiry_date} IS NOT NULL`,
          sql`${pharmacy_medicines.expiry_date} <= ${thresholdDate}`,
          sql`${pharmacy_medicines.expiry_date} >= ${today}`
        )
      )
      .orderBy(asc(pharmacy_medicines.expiry_date));
      
    return expiringItems.map(item => {
      // Calculer le nombre de jours avant expiration
      const daysUntilExpiry = item.expiryDate 
        ? Math.ceil((item.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) 
        : null;
        
      return {
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        medicineDescription: item.medicineDescription || '',
        currentStock: item.currentStock,
        alertThreshold: item.alertThreshold,
        reorderLevel: item.reorderLevel,
        expiryDate: item.expiryDate,
        daysUntilExpiry,
        unitPrice: item.unitPrice,
        totalValue: item.currentStock * item.unitPrice,
        locationInPharmacy: item.locationInPharmacy || '',
        alertType: 'EXPIRING_SOON',
        updatedAt: item.updatedAt,
      };
    });
  }

  /**
   * Obtient un résumé du stock d'une pharmacie
   */
  async getStockSummary(pharmacyId: number) {
    // Vérifier si la pharmacie existe
    const pharmacy = await this.databaseService.db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);
    
    if (pharmacy.length === 0) {
      throw new NotFoundException(`Pharmacie avec ID ${pharmacyId} non trouvée`);
    }
    
    // Calculer la date limite d'expiration (aujourd'hui + 30 jours)
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    const ninetyDaysLater = new Date();
    ninetyDaysLater.setDate(today.getDate() + 90);
    
    // Obtenir le nombre total de médicaments en stock
    const [{ count: totalMedicines }] = await this.databaseService.db
      .select({ count: count() })
      .from(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          sql`${pharmacy_medicines.quantity} > 0`
        )
      );
      
    // Obtenir le nombre de médicaments en stock faible
    const [{ count: lowStockCount }] = await this.databaseService.db
      .select({ count: count() })
      .from(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          sql`${pharmacy_medicines.quantity} <= ${pharmacy_medicines.alert_threshold}`,
          sql`${pharmacy_medicines.quantity} > 0`
        )
      );
      
    // Obtenir le nombre de médicaments en rupture de stock
    const [{ count: outOfStockCount }] = await this.databaseService.db
      .select({ count: count() })
      .from(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          sql`${pharmacy_medicines.quantity} = 0`
        )
      );
      
    // Obtenir le nombre de médicaments qui expirent dans les 30 jours
    const [{ count: expiringWithin30Days }] = await this.databaseService.db
      .select({ count: count() })
      .from(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          sql`${pharmacy_medicines.quantity} > 0`,
          sql`${pharmacy_medicines.expiry_date} IS NOT NULL`,
          sql`${pharmacy_medicines.expiry_date} <= ${thirtyDaysLater}`,
          sql`${pharmacy_medicines.expiry_date} >= ${today}`
        )
      );
      
    // Obtenir le nombre de médicaments qui expirent dans les 90 jours
    const [{ count: expiringWithin90Days }] = await this.databaseService.db
      .select({ count: count() })
      .from(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          sql`${pharmacy_medicines.quantity} > 0`,
          sql`${pharmacy_medicines.expiry_date} IS NOT NULL`,
          sql`${pharmacy_medicines.expiry_date} <= ${ninetyDaysLater}`,
          sql`${pharmacy_medicines.expiry_date} >= ${today}`
        )
      );
      
    // Obtenir la valeur totale du stock
    const [{ totalValue }] = await this.databaseService.db
      .select({
        totalValue: sql`SUM(${pharmacy_medicines.quantity} * ${pharmacy_medicines.unit_price})`
      })
      .from(pharmacy_medicines)
      .where(eq(pharmacy_medicines.pharmacy_id, pharmacyId));
      
    // Obtenir les 5 produits les plus vendus ce mois-ci
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const topSellingProducts = await this.databaseService.db
      .select({
        medicineId: stock_movements.medicine_id,
        medicineName: medicines.name,
        totalSold: sql`SUM(ABS(${stock_movements.quantity}))`
      })
      .from(stock_movements)
      .innerJoin(medicines, eq(stock_movements.medicine_id, medicines.id))
      .where(
        and(
          eq(stock_movements.pharmacy_id, pharmacyId),
          eq(stock_movements.movement_type, 'SALE'),
          sql`${stock_movements.created_at} >= ${startOfMonth}`
        )
      )
      .groupBy(stock_movements.medicine_id, medicines.name)
      .orderBy(sql`SUM(ABS(${stock_movements.quantity})) DESC`)
      .limit(5);
      
    return {
      totalMedicines,
      lowStockCount,
      outOfStockCount,
      expiringWithin30Days,
      expiringWithin90Days,
      totalStockValue: totalValue || 0,
      topSellingProducts: topSellingProducts.map(product => ({
        medicineId: product.medicineId,
        medicineName: product.medicineName,
        totalSold: Number(product.totalSold)
      }))
    };
  }
}
