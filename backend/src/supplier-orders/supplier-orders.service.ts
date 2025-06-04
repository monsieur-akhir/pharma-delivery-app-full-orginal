import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, and, lt } from 'drizzle-orm';
import { 
  supplier_orders,
  supplier_order_items,
  medicines,
  pharmacy_medicines,
  type SupplierOrder,
  type InsertSupplierOrder,
  type SupplierOrderItem,
  type InsertSupplierOrderItem
} from '../../../shared/schema';

@Injectable()
export class SupplierOrdersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<SupplierOrder[]> {
    return this.databaseService.db.select().from(supplier_orders);
  }

  async findById(id: number): Promise<SupplierOrder | undefined> {
    const [order] = await this.databaseService.db
      .select()
      .from(supplier_orders)
      .where(eq(supplier_orders.id, id));
    return order;
  }

  async findByPharmacy(pharmacyId: number): Promise<SupplierOrder[]> {
    return this.databaseService.db
      .select()
      .from(supplier_orders)
      .where(eq(supplier_orders.pharmacy_id, pharmacyId))
      .orderBy(supplier_orders.created_at);
  }

  async createOrder(
    pharmacyId: number,
    supplierId: number | null,
    supplierName: string | null,
    items: Array<{
      medicineId: number;
      quantity: number;
      unitPrice?: number;
    }>,
    status: string = 'pending',
    notes: string | null = null // notes parameter kept for compatibility but not used in DB
  ): Promise<{ order: SupplierOrder; items: SupplierOrderItem[] }> {
    // Calculate total based on quantity and unit price
    let total = 0;
    for (const item of items) {
      total += (item.unitPrice || 0) * item.quantity;
    }

    // Create the supplier order
    const insertOrderData: Partial<InsertSupplierOrder> = {
      pharmacy_id: pharmacyId,
      // order_number field is defined in schema.ts but doesn't exist in actual DB
      // order_number: `SO-${Date.now().toString().slice(-6)}`,
      supplier_name: supplierName || 'Unknown Supplier',
      status,
      total_amount: total.toString(), // Convert to string for decimal
      // notes field is defined in schema.ts but doesn't exist in actual DB
      // notes: notes,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Convert the object to an array with a single item as the Drizzle .values() method expects an array
    const [newOrder] = await this.databaseService.db
      .insert(supplier_orders)
      .values([insertOrderData as any]) // Using 'as any' to bypass TypeScript type checking temporarily
      .returning();

    // Create the order items
    const orderItems: InsertSupplierOrderItem[] = items.map(item => {
      const unitPrice = item.unitPrice || 0;
      return {
        supplier_order_id: newOrder.id,
        medicine_id: item.medicineId,
        quantity: item.quantity,
        unit_price: unitPrice.toString(), // Convert to string for decimal
        total_price: (unitPrice * item.quantity).toString(), // Calculate total price
        created_at: new Date(),
      };
    });

    const createdItems = await this.databaseService.db
      .insert(supplier_order_items)
      .values(orderItems)
      .returning();

    return { order: newOrder, items: createdItems };
  }

  async updateOrderStatus(
    id: number,
    status: string,
    notes: string | null = null
  ): Promise<SupplierOrder> {
    // notes field is defined in schema.ts but doesn't exist in actual DB
    const [updatedOrder] = await this.databaseService.db
      .update(supplier_orders)
      .set({
        status,
        // ...(notes && { notes }),  // notes field doesn't exist in actual DB
        updated_at: new Date(),
      })
      .where(eq(supplier_orders.id, id))
      .returning();

    // If the order is marked as received, update inventory
    if (status === 'received') {
      await this.updateInventoryFromOrder(id);
    }

    return updatedOrder;
  }

  async updateOrder(
    id: number,
    updateData: Partial<{
      supplierId: number;
      supplierName: string;
      status: string;
      notes: string;
      total: number;
      items: Array<{
        medicineId: number;
        quantity: number;
        unitPrice?: number;
      }>;
    }>
  ): Promise<{ order: SupplierOrder; items?: SupplierOrderItem[] }> {
    // If items are provided, calculate a new total
    let total = updateData.total;
    if (updateData.items) {
      total = 0;
      for (const item of updateData.items) {
        total += (item.unitPrice || 0) * item.quantity;
      }
    }

    // Update the order
    const [updatedOrder] = await this.databaseService.db
      .update(supplier_orders)
      .set({
        ...(updateData.supplierId !== undefined && { supplier_id: updateData.supplierId }),
        ...(updateData.supplierName && { supplier_name: updateData.supplierName }),
        ...(updateData.status && { status: updateData.status }),
        // ...(updateData.notes && { notes: updateData.notes }), // notes field doesn't exist in actual DB
        ...(total !== undefined && { total_amount: total.toString() }),
        updated_at: new Date(),
      })
      .where(eq(supplier_orders.id, id))
      .returning();

    // If items are provided, update them by:
    // 1. Delete existing items
    // 2. Insert new items
    let updatedItems: SupplierOrderItem[] | undefined = undefined;
    if (updateData.items) {
      await this.databaseService.db
        .delete(supplier_order_items)
        .where(eq(supplier_order_items.supplier_order_id, id));

      const orderItems: InsertSupplierOrderItem[] = updateData.items.map(item => {
        const unitPrice = item.unitPrice || 0;
        return {
          supplier_order_id: id,
          medicine_id: item.medicineId,
          quantity: item.quantity,
          unit_price: unitPrice.toString(), // Convert to string for decimal
          total_price: (unitPrice * item.quantity).toString(), // Calculate total price
          created_at: new Date()
        };
      });

      // Note: orderItems is already an array, so this should work as is
      updatedItems = await this.databaseService.db
        .insert(supplier_order_items)
        .values(orderItems)
        .returning();
    }

    // If the order is marked as received, update inventory
    if (updateData.status === 'received') {
      await this.updateInventoryFromOrder(id);
    }

    return { order: updatedOrder, ...(updatedItems && { items: updatedItems }) };
  }

  async deleteOrder(id: number): Promise<boolean> {
    // First delete all order items
    await this.databaseService.db
      .delete(supplier_order_items)
      .where(eq(supplier_order_items.supplier_order_id, id));

    // Then delete the order
    const result = await this.databaseService.db
      .delete(supplier_orders)
      .where(eq(supplier_orders.id, id))
      .returning();

    return result.length > 0;
  }

  async getOrderWithItems(id: number) {
    const [order] = await this.databaseService.db
      .select()
      .from(supplier_orders)
      .where(eq(supplier_orders.id, id));

    if (!order) {
      return null;
    }

    // Modification to select only specific columns from medicines to avoid 
    // "column medicines.generic_name does not exist" error
    const items = await this.databaseService.db
      .select({
        supplier_order_items: supplier_order_items,
        medicines: {
          id: medicines.id,
          name: medicines.name
        }
      })
      .from(supplier_order_items)
      .leftJoin(medicines, eq(supplier_order_items.medicine_id, medicines.id))
      .where(eq(supplier_order_items.supplier_order_id, id));

    return {
      ...order,
      items: items.map(item => ({
        id: item.supplier_order_items.id,
        medicineId: item.supplier_order_items.medicine_id,
        medicineName: item.medicines?.name || 'Unknown',
        quantity: item.supplier_order_items.quantity,
        unitPrice: item.supplier_order_items.unit_price,
        total: item.supplier_order_items.total_price,
      })),
    };
  }

  private async updateInventoryFromOrder(orderId: number) {
    // Get all items from the order
    const items = await this.databaseService.db
      .select()
      .from(supplier_order_items)
      .where(eq(supplier_order_items.supplier_order_id, orderId));

    // For each item, update the pharmacy's inventory
    for (const item of items) {
      // Check if the pharmacy already has this medicine
      const [pharmacyMedicine] = await this.databaseService.db
        .select()
        .from(pharmacy_medicines)
        .where(
          and(
            eq(pharmacy_medicines.medicine_id, item.medicine_id),
            eq(pharmacy_medicines.pharmacy_id, (await this.findById(orderId)).pharmacy_id)
          )
        );

      if (pharmacyMedicine) {
        // Update existing inventory
        // The actual database schema uses 'stock' according to the error message
        await this.databaseService.db
          .update(pharmacy_medicines)
          .set({
            stock: pharmacyMedicine.stock + item.quantity,
            updated_at: new Date(),
          })
          .where(eq(pharmacy_medicines.id, pharmacyMedicine.id));
      } else {
        // Add new medicine to pharmacy inventory
        const unitPrice = typeof item.unit_price === 'string' 
          ? parseFloat(item.unit_price) 
          : Number(item.unit_price);
        
        await this.databaseService.db
          .insert(pharmacy_medicines)
          .values([{
            pharmacy_id: (await this.findById(orderId)).pharmacy_id,
            medicine_id: item.medicine_id,
            stock: item.quantity,
            price: (unitPrice * 1.3).toString(), // 30% markup as default
            created_at: new Date(),
            updated_at: new Date(),
          } as any]);
      }
    }
  }

  async checkLowStockAndCreateOrders(pharmacyId: number, threshold: number = 10) {
    // Get all medicines with low stock for this pharmacy
    const lowStockItems = await this.databaseService.db
      .select()
      .from(pharmacy_medicines)
      .leftJoin(medicines, eq(pharmacy_medicines.medicine_id, medicines.id))
      .where(
        and(
          eq(pharmacy_medicines.pharmacy_id, pharmacyId),
          lt(pharmacy_medicines.stock, threshold)
        )
      );

    if (lowStockItems.length === 0) {
      return null; // No low stock items found
    }

    // Create automatic order for these items
    const orderItems = lowStockItems.map(item => {
      const price = typeof item.pharmacy_medicines.price === 'string' 
        ? parseFloat(item.pharmacy_medicines.price) 
        : Number(item.pharmacy_medicines.price);
      
      return {
        medicineId: item.pharmacy_medicines.medicine_id,
        quantity: Math.max(threshold * 2 - item.pharmacy_medicines.stock, 5), // Reorder to get at least 2x threshold, minimum 5
        unitPrice: price / 1.3, // Estimate cost price from selling price
      };
    });

    // Create the supplier order
    return this.createOrder(
      pharmacyId,
      null, // No specific supplier yet
      'Automatic Reorder',
      orderItems,
      'pending',
      'Automatically generated for low stock items'
    );
  }
}