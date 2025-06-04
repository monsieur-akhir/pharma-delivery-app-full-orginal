// src/medicines/medicines.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, ilike, and, or, lt, gt, SQL, sql } from 'drizzle-orm';
import {
  medicines,
  pharmacy_medicines,
  type Medicine,
  type InsertMedicine,
} from '../../../shared/schema';
import {
  CreateMedicineDto,
  UpdateMedicineDto,
  MedicineFilterDto,
  MedicineResponseDto,
} from './dto';

@Injectable()
export class MedicinesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(
    filter: MedicineFilterDto,
    user: any,
  ): Promise<MedicineResponseDto[]> {
    const {
      name,
      category,
      inStock,
      pharmacyId,
      page = 1,
      limit = 20,
    } = filter;
    const targetPharmacy = pharmacyId || user.pharmacyId;

    // Build conditions for the query
    let whereConditions = [eq(pharmacy_medicines.pharmacy_id, targetPharmacy)];
    
    if (name) {
      whereConditions.push(
        or(
          ilike(medicines.name, `%${name}%`),
          ilike(medicines.generic_name, `%${name}%`),
        ),
      );
    }
    if (category) {
      whereConditions.push(eq(medicines.category, category));
    }
    if (inStock !== undefined) {
      if (inStock) {
        whereConditions.push(gt(pharmacy_medicines.stock, 0));
      } else {
        whereConditions.push(eq(pharmacy_medicines.stock, 0));
      }
    }

    // Apply all filters in a single where clause
    const query = this.databaseService.db
      .select({
        id: medicines.id,
        name: medicines.name,
        generic_name: medicines.generic_name,
        manufacturer: medicines.manufacturer,
        category: medicines.category,
        description: medicines.description,
        requires_prescription: medicines.requires_prescription,
        price: pharmacy_medicines.price,
        stock: pharmacy_medicines.stock,
      })
      .from(medicines)
      .innerJoin(
        pharmacy_medicines,
        eq(medicines.id, pharmacy_medicines.medicine_id),
      )
      .where(and(...whereConditions))
      .orderBy(medicines.name)
      .limit(limit)
      .offset((page - 1) * limit);

    const rows = await query;

    // Map to DTO format
    return rows.map(row => this.mapToMedicineResponseDto(row));
  }

  async getCategories(): Promise<string[]> {
    // Use raw SQL execution for distinct operation
    const categoriesResult = await this.databaseService.db.execute<{ category: string }>(
      sql`SELECT DISTINCT ${medicines.category} AS category FROM ${medicines} WHERE ${medicines.category} IS NOT NULL ORDER BY ${medicines.category}`
    );
    
    // Convert result to array of category names
    return (categoriesResult as unknown as { category: string }[])
      .map(row => row.category)
      .filter(Boolean);
  }

  async getLowStock(user: any): Promise<MedicineResponseDto[]> {
    const pharmacyId = user.pharmacyId;
    const threshold = 10;
    const rows = await this.databaseService.db
      .select({
        id: medicines.id,
        name: medicines.name,
        generic_name: medicines.generic_name,
        manufacturer: medicines.manufacturer,
        category: medicines.category,
        description: medicines.description,
        requires_prescription: medicines.requires_prescription,
        price: pharmacy_medicines.price,
        stock: pharmacy_medicines.stock,
      })
      .from(medicines)
      .innerJoin(
        pharmacy_medicines,
        eq(medicines.id, pharmacy_medicines.medicine_id),
      )
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          lt(pharmacy_medicines.stock, threshold),
        ),
      )
      .orderBy(medicines.name);

    return rows.map(row => this.mapToMedicineResponseDto(row));
  }

  async getExpiringSoon(user: any): Promise<MedicineResponseDto[]> {
    // Since expiry_date doesn't exist in the medicines table, this method
    // needs to be modified. For now, we'll return low stock medicines instead
    // as a placeholder until the schema is updated with expiry dates
    return this.getLowStock(user);
  }

  async getStatistics(user: any): Promise<any> {
    const pharmacyId = user.pharmacyId;
    
    // Use SQL for count operations with explicit type casting
    const totalResult = await this.databaseService.db.execute<{ count: number }>(
      sql`SELECT COUNT(*)::int as count FROM ${medicines}
      INNER JOIN ${pharmacy_medicines} ON ${medicines.id} = ${pharmacy_medicines.medicine_id}
      WHERE ${pharmacy_medicines.pharmacy_id} = ${pharmacyId}`
    );
    
    const lowStockResult = await this.databaseService.db.execute<{ count: number }>(
      sql`SELECT COUNT(*)::int as count FROM ${pharmacy_medicines}
      WHERE ${pharmacy_medicines.pharmacy_id} = ${pharmacyId} 
      AND ${pharmacy_medicines.stock} < 10`
    );

    const total = totalResult[0]?.count ?? 0;
    const lowStock = lowStockResult[0]?.count ?? 0;

    return {
      total,
      lowStock,
      expiringSoon: 0, // Cannot calculate without expiry_date field
    };
  }

  async findOne(id: number, user: any): Promise<MedicineResponseDto> {
    const pharmacyId = user.pharmacyId;
    const [row] = await this.databaseService.db
      .select({
        id: medicines.id,
        name: medicines.name,
        generic_name: medicines.generic_name,
        manufacturer: medicines.manufacturer,
        category: medicines.category,
        description: medicines.description,
        requires_prescription: medicines.requires_prescription,
        price: pharmacy_medicines.price,
        stock: pharmacy_medicines.stock,
      })
      .from(medicines)
      .innerJoin(
        pharmacy_medicines,
        eq(medicines.id, pharmacy_medicines.medicine_id),
      )
      .where(
        and(
          eq(medicines.id, id),
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
        ),
      );

    if (!row) {
      throw new NotFoundException('Medicine not found');
    }
    return this.mapToMedicineResponseDto(row);
  }

  async create(
    dto: CreateMedicineDto,
    user: any,
  ): Promise<MedicineResponseDto> {
    const { price, stockQuantity, ...medicineData } = dto as any;
    const [newMed] = await this.databaseService.db
      .insert(medicines)
      .values({
        ...medicineData,
        created_at: new Date(),
        updated_at: new Date(),
      } as InsertMedicine)
      .returning();

    await this.databaseService.db
      .insert(pharmacy_medicines)
      .values({
        pharmacy_id: user.pharmacyId,
        medicine_id: newMed.id,
        price: price.toString(),
        stock: stockQuantity,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();

    return this.findOne(newMed.id, user);
  }

  async update(
    id: number,
    dto: UpdateMedicineDto,
    user: any,
  ): Promise<MedicineResponseDto> {
    const { price, stockQuantity, ...medicineData } = dto as any;
    // Update base medicine fields
    if (Object.keys(medicineData).length) {
      await this.databaseService.db
        .update(medicines)
        .set({ ...medicineData, updated_at: new Date() })
        .where(eq(medicines.id, id))
        .execute();
    }

    // Update pharmacy-specific fields
    if (price !== undefined || stockQuantity !== undefined) {
      const updates: any = { updated_at: new Date() };
      if (price !== undefined) updates.price = price.toString();
      if (stockQuantity !== undefined) updates.stock = stockQuantity;

      await this.databaseService.db
        .update(pharmacy_medicines)
        .set(updates)
        .where(
          and(
            eq(pharmacy_medicines.pharmacy_id, user.pharmacyId),
            eq(pharmacy_medicines.medicine_id, id),
          ),
        )
        .execute();
    }

    return this.findOne(id, user);
  }

  async remove(id: number, user: any): Promise<void> {
    // Remove from pharmacy inventory
    await this.databaseService.db
      .delete(pharmacy_medicines)
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, user.pharmacyId),
          eq(pharmacy_medicines.medicine_id, id),
        ),
      )
      .execute();

    // Optionally remove from global medicines
    await this.databaseService.db
      .delete(medicines)
      .where(eq(medicines.id, id))
      .execute();
  }

  async importMedicines(
    importData: any[],
    user: any,
  ): Promise<{ imported: number; updated: number }> {
    let imported = 0;
    let updated = 0;

    for (const row of importData) {
      const { price, stockQuantity, id, ...medData } = row;
      if (id) {
        await this.update(id, row as UpdateMedicineDto, user);
        updated++;
      } else {
        await this.create(row as CreateMedicineDto, user);
        imported++;
      }
    }
    return { imported, updated };
  }

  async exportMedicines(
    filter: MedicineFilterDto,
    user: any,
  ): Promise<MedicineResponseDto[]> {
    // Reuse findAll to get filtered list
    return this.findAll(filter, user);
  }

  async updateStock(
    id: number,
    stockData: { quantity: number; type: 'add' | 'remove' | 'set' },
    user: any,
  ): Promise<MedicineResponseDto> {
    let change = 0;
    const current = await this.findOne(id, user);
    switch (stockData.type) {
      case 'add':
        change = stockData.quantity;
        break;
      case 'remove':
        change = -stockData.quantity;
        break;
      case 'set':
        change = stockData.quantity - current.stock;
        break;
    }
    if (current.stock + change < 0) {
      throw new BadRequestException('Insufficient stock');
    }
    await this.databaseService.db
      .update(pharmacy_medicines)
      .set({
        stock: current.stock + change,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, user.pharmacyId),
          eq(pharmacy_medicines.medicine_id, id),
        ),
      )
      .execute();

    return this.findOne(id, user);
  }

  async getMedicineById(id: number): Promise<MedicineResponseDto> {
    const [row] = await this.databaseService.db
      .select({
        id: medicines.id,
        name: medicines.name,
        generic_name: medicines.generic_name,
        manufacturer: medicines.manufacturer,
        category: medicines.category,
        description: medicines.description,
        requires_prescription: medicines.requires_prescription,
        price: pharmacy_medicines.price,
        stock: pharmacy_medicines.stock,
      })
      .from(medicines)
      .innerJoin(
        pharmacy_medicines,
        eq(medicines.id, pharmacy_medicines.medicine_id),
      )
      .where(eq(medicines.id, id));

    if (!row) {
      throw new NotFoundException('Medicine not found');
    }
    return this.mapToMedicineResponseDto(row);
  }

  // Helper function to map database row to MedicineResponseDto
  private mapToMedicineResponseDto(row: any): MedicineResponseDto {
    const dto = new MedicineResponseDto();
    dto.id = row.id;
    dto.name = row.name;
    dto.generic = row.generic_name;
    dto.manufacturer = row.manufacturer;
    dto.category = row.category;
    dto.description = row.description;
    dto.prescriptionRequired = row.requires_prescription;
    dto.price = parseFloat(row.price);
    dto.stock = row.stock;
    dto.inStock = row.stock > 0;
    
    // Set default values for required fields that aren't in the database
    dto.dosage = '';
    dto.minStock = 0;
    dto.maxStock = 0;
    dto.expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // Default to 1 year from now
    dto.createdAt = new Date();
    dto.updatedAt = new Date();
    
    return dto;
  }
}

