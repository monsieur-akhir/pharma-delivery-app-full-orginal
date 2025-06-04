import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SupplierOrdersService } from '../supplier-orders/supplier-orders.service';
import { and, eq, lt, sql } from 'drizzle-orm';
import { pharmacy_medicines } from '../../../shared/schema';

@Injectable()
export class ScheduledTasksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledTasksService.name);
  private checkLowStockMedicinesInterval: NodeJS.Timeout;
  private processRemindersInterval: NodeJS.Timeout;
  private checkInactiveOrdersInterval: NodeJS.Timeout;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly supplierOrdersService: SupplierOrdersService,
  ) {}
  
  async onModuleInit() {
    // Run startup tasks
    setTimeout(() => this.handleStartup(), 5000);
    
    // Setup recurring tasks
    // Every day at 1 AM (in milliseconds: 24 hours * 60 minutes * 60 seconds * 1000)
    const oneDayMs = 24 * 60 * 60 * 1000;
    this.checkLowStockMedicinesInterval = setInterval(() => this.checkLowStockMedicines(), oneDayMs);
    
    // Every 5 minutes (in milliseconds: 5 minutes * 60 seconds * 1000)
    const fiveMinutesMs = 5 * 60 * 1000;
    this.processRemindersInterval = setInterval(() => this.processReminders(), fiveMinutesMs);
    
    // Every hour (in milliseconds: 60 minutes * 60 seconds * 1000)
    const oneHourMs = 60 * 60 * 1000;
    this.checkInactiveOrdersInterval = setInterval(() => this.checkInactiveOrders(), oneHourMs);
  }
  
  // Add supplier order service methods for now
  // These will be moved to the supplier orders service later
  private async getActiveSupplierOrdersByPharmacy(pharmacyId: number) {
    try {
      const orders = await this.supplierOrdersService.findByPharmacy(pharmacyId);
      
      // Filter to only include active orders (those with status 'PENDING' or 'ORDERED')
      return orders.filter(order => 
        order.status === 'PENDING' || order.status === 'ORDERED'
      );
    } catch (error) {
      this.logger.error(`Error getting active supplier orders: ${error.message}`, error.stack);
      return [];
    }
  }
  
  private async addItemToSupplierOrder(orderId: number, medicineId: number, quantity: number) {
    try {
      // First, get the current order with items
      const existingOrder = await this.supplierOrdersService.getOrderWithItems(orderId);
      
      if (!existingOrder) {
        this.logger.error(`Order ${orderId} not found, cannot add item`);
        return;
      }
      
      // Check if the medicine is already in the order
      const existingItem = existingOrder.items.find(item => item.medicineId === medicineId);
      
      let newItems = [];
      
      if (existingItem) {
        // Update quantity if medicine already exists in order
        newItems = existingOrder.items.map(item => {
          if (item.medicineId === medicineId) {
            // Get existing price to keep it consistent
            const unitPrice = parseFloat(item.unitPrice);
            return {
              medicineId: item.medicineId,
              quantity: item.quantity + quantity,
              unitPrice
            };
          }
          return {
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice)
          };
        });
      } else {
        // Add new item to order
        // Get medicine price from database
        const result = await this.databaseService.db.execute(
          sql`SELECT * FROM medicines WHERE id = ${medicineId}`
        );
        
        const medicine = result.rows?.[0];
        const unitPrice = medicine?.cost_price || 0;
        
        // Convert existing items to the format expected by updateOrder
        newItems = existingOrder.items.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice)
        }));
        
        // Add the new item
        newItems.push({
          medicineId,
          quantity,
          unitPrice
        });
      }
      
      // Update the order with the new items
      await this.supplierOrdersService.updateOrder(orderId, {
        items: newItems,
        // Recalculate the total
        total: newItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      });
      
      this.logger.log(`Added ${quantity} of medicine ${medicineId} to supplier order ${orderId}`);
    } catch (error) {
      this.logger.error(`Error adding item to supplier order: ${error.message}`, error.stack);
    }
  }
  
  private async createSupplierOrder(orderData: any) {
    try {
      const items = orderData.items.map((item: any) => ({
        medicineId: item.medicine_id,
        quantity: item.quantity,
        unitPrice: item.unit_price || 0
      }));
      
      const result = await this.supplierOrdersService.createOrder(
        orderData.pharmacy_id,
        null, // supplierId
        'Auto Supplier', // supplierName
        items,
        orderData.status || 'PENDING',
        orderData.notes || 'Automatically generated order'
      );
      
      this.logger.log(`Successfully created new supplier order ${result.order.id} for pharmacy ${orderData.pharmacy_id}`);
      return result.order;
    } catch (error) {
      this.logger.error(`Failed to create supplier order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Run once at startup to check for low stock medicines
   */
  async handleStartup() {
    this.logger.log('Running startup check for low stock medicines');
    await this.checkLowStockMedicines();
  }

  /**
   * Check for medicines below reorder threshold every night at 1 AM
   */
  async checkLowStockMedicines() {
    this.logger.log('Running scheduled task: Check low stock medicines');
    
    try {
      // Get all pharmacy medicines where stock_quantity is low (less than 5)
      // Note: We're using a hardcoded threshold of 5 since reorder_threshold column doesn't exist yet
      const result = await this.databaseService.db.execute(
        sql`SELECT * FROM pharmacy_medicines WHERE stock_quantity < 5`
      );
      
      // Convert result to array of items
      const lowStockItems = result.rows as any[];
      
      this.logger.log(`Found ${lowStockItems.length} medicines below reorder threshold`);
      
      if (lowStockItems.length === 0) {
        return;
      }
      
      // Group low stock items by pharmacy for batch processing
      const pharmacyGroups = this.groupByPharmacy(lowStockItems);
      
      for (const [pharmacyId, items] of Object.entries(pharmacyGroups)) {
        await this.processPharmacyLowStockItems(Number(pharmacyId), items as any[]);
      }
    } catch (error) {
      this.logger.error(`Error checking low stock medicines: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Process low stock items for a specific pharmacy
   */
  private async processPharmacyLowStockItems(pharmacyId: number, items: any[]) {
    try {
      this.logger.log(`Processing ${items.length} low stock items for pharmacy ${pharmacyId}`);
      
      // Check if there's already an active supplier order for this pharmacy
      const activeOrders = await this.getActiveSupplierOrdersByPharmacy(pharmacyId);
      
      if (activeOrders.length > 0) {
        this.logger.log(`Pharmacy ${pharmacyId} already has ${activeOrders.length} active supplier orders. Adding items to existing order.`);
        
        // Get the most recent active order
        const latestOrder = activeOrders[0];
        
        // Add items to the existing order
        for (const item of items) {
          // Calculate order quantity (to reach optimal stock level)
          const orderQuantity = this.calculateOrderQuantity(item);
          
          if (orderQuantity <= 0) {
            continue;
          }
          
          await this.addItemToSupplierOrder(
            latestOrder.id,
            item.medicine_id,
            orderQuantity
          );
        }
      } else {
        // Create a new supplier order
        this.logger.log(`Creating new supplier order for pharmacy ${pharmacyId}`);
        
        const orderItems = items.map(item => ({
          medicine_id: item.medicine_id,
          quantity: this.calculateOrderQuantity(item),
          unit_price: item.cost_price || 0,
        })).filter(item => item.quantity > 0);
        
        if (orderItems.length === 0) {
          this.logger.log(`No items to order for pharmacy ${pharmacyId}`);
          return;
        }
        
        await this.createSupplierOrder({
          pharmacy_id: pharmacyId,
          status: 'PENDING',
          total_amount: orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
          created_by: null, // System generated
          notes: 'Automatically generated from low stock detection',
          items: orderItems,
        });
        
        this.logger.log(`Created new supplier order for pharmacy ${pharmacyId} with ${orderItems.length} items`);
      }
    } catch (error) {
      this.logger.error(`Error processing low stock items for pharmacy ${pharmacyId}: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Group low stock items by pharmacy
   */
  private groupByPharmacy(items: any[]) {
    return items.reduce((groups, item) => {
      const key = item.pharmacy_id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }
  
  /**
   * Calculate order quantity based on current stock, reorder threshold, and optimal stock
   */
  private calculateOrderQuantity(item: any) {
    // Since optimal_stock and reorder_threshold columns don't exist yet,
    // we'll use a hardcoded target stock level of 10
    const targetStock = 10;
    const orderQuantity = targetStock - item.stock_quantity;
    
    // Ensure we're ordering at least 1 unit
    return Math.max(1, Math.round(orderQuantity));
  }
  
  /**
   * Run every 15 minutes to check and process reminders
   */
  async processReminders() {
    this.logger.log('Running scheduled task: Process medication reminders');
    
    try {
      // This will be implemented in a separate feature for medication reminders
    } catch (error) {
      this.logger.error(`Error processing reminders: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Run every hour to check for inactive orders
   */
  async checkInactiveOrders() {
    this.logger.log('Running scheduled task: Check inactive orders');
    
    try {
      // This will be implemented in a separate feature for order management
    } catch (error) {
      this.logger.error(`Error checking inactive orders: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Clean up all timers when the module is destroyed
   */
  onModuleDestroy() {
    this.logger.log('Cleaning up scheduled tasks...');
    
    if (this.checkLowStockMedicinesInterval) {
      clearInterval(this.checkLowStockMedicinesInterval);
    }
    
    if (this.processRemindersInterval) {
      clearInterval(this.processRemindersInterval);
    }
    
    if (this.checkInactiveOrdersInterval) {
      clearInterval(this.checkInactiveOrdersInterval);
    }
  }
}