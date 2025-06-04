import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, and, desc, inArray, sql, count } from 'drizzle-orm';
import { 
  orders, 
  order_items,
  pharmacy_medicines,
  users,
  pharmacies,
  medicines,
  orderStatusEnum,
  type Order,
  type InsertOrder,
  type InsertOrderItem
} from '../../../shared/schema';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly validStatuses = [
    'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  ] as const;

  constructor(private readonly databaseService: DatabaseService) {
    this.logger.log('OrdersService instantiated');
  }
  
  private getValidOrderStatus(status?: string): typeof this.validStatuses[number] {
    const normalized = status?.trim().toUpperCase();
    return this.validStatuses.includes(normalized as any) 
      ? normalized as typeof this.validStatuses[number]
      : 'PENDING';
  }

  async findAll(): Promise<Order[]> {
    this.logger.log('findAll called');
    try {
      const result = await this.databaseService.db
        .select()
        .from(orders)
        .orderBy(desc(orders.created_at));
      this.logger.log(`findAll returned ${result.length} orders`);
      return result;
    } catch (error) {
      this.logger.error('Error in findAll', error.stack);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async findAllPaginated(
    page = 1, 
    limit = 10
  ): Promise<{ orders: Order[]; total: number }> {
    this.logger.log(`findAllPaginated called with page=${page}, limit=${limit}`);
    
    try {
      const offset = (page - 1) * limit;
      
      // Execute count and data queries in parallel
      const [totalResult, ordersData] = await Promise.all([
        this.databaseService.db
          .select({ count: count() })
          .from(orders),
        
        this.databaseService.db
          .select({
            id: orders.id,
            userId: orders.user_id,
            status: orders.status,
            totalPrice: orders.total_amount,
            createdAt: orders.created_at,
          })
          .from(orders)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(orders.created_at))
      ]);

      const total = Number(totalResult[0]?.count ?? 0);
      const orderIds = ordersData.map(o => o.id);

      // Early return if no orders found
      if (orderIds.length === 0) {
        return { orders: [], total };
      }

      // Fetch items in a single query
      const orderItems = await this.databaseService.db
        .select({
          order_id: order_items.order_id,
          medicine_id: order_items.medicine_id,
          quantity: order_items.quantity,
          price: order_items.unit_price
        })
        .from(order_items)
        .where(inArray(order_items.order_id, orderIds));

      // Group items by order_id
      const itemsMap = orderItems.reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push(item);
        return acc;
      }, {} as Record<number, typeof orderItems>);

      // Combine orders with their items
      const ordersWithItems = ordersData.map(order => ({
        ...order,
        items: itemsMap[order.id] || []
      }));

      return { 
        orders: ordersWithItems, 
        total 
      };
    } catch (error) {
      this.logger.error('Error in findAllPaginated', error.stack);
      throw new Error(`Failed to fetch paginated orders: ${error.message}`);
    }
  }

  async findById(id: number): Promise<Order | null> {
    this.logger.log(`findById called with id=${id}`);
    try {
      const [order] = await this.databaseService.db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      return order || null;
    } catch (error) {
      this.logger.error(`Error in findById`, error.stack);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  async findUserOrders(userId: number): Promise<Order[]> {
    this.logger.log(`findUserOrders called with userId=${userId}`);
    try {
      return await this.databaseService.db
        .select()
        .from(orders)
        .where(eq(orders.user_id, userId))
        .orderBy(desc(orders.created_at));
    } catch (error) {
      this.logger.error(`Error in findUserOrders`, error.stack);
      throw new Error(`Failed to fetch user orders: ${error.message}`);
    }
  }

  async findPharmacyOrders(pharmacyId: number): Promise<Order[]> {
    this.logger.log(`findPharmacyOrders called with pharmacyId=${pharmacyId}`);
    try {
      return await this.databaseService.db
        .select()
        .from(orders)
        .where(eq(orders.pharmacy_id, pharmacyId))
        .orderBy(desc(orders.created_at));
    } catch (error) {
      this.logger.error(`Error in findPharmacyOrders`, error.stack);
      throw new Error(`Failed to fetch pharmacy orders: ${error.message}`);
    }
  }

  async findDeliveryPersonOrders(deliveryPersonId: number): Promise<Order[]> {
    this.logger.log(`findDeliveryPersonOrders called with deliveryPersonId=${deliveryPersonId}`);
    try {
      return await this.databaseService.db
        .select()
        .from(orders)
        .where(eq(orders.delivery_person_id, deliveryPersonId))
        .orderBy(desc(orders.created_at));
    } catch (error) {
      this.logger.error(`Error in findDeliveryPersonOrders`, error.stack);
      throw new Error(`Failed to fetch delivery person orders: ${error.message}`);
    }
  }

  async createOrder(
    orderData: {
      userId: number;
      pharmacyId: number;
      deliveryAddress: string;
      deliveryCoordinates?: { lat: number; lng: number };
      paymentMethod?: string;
      paymentIntentId?: string;
    },
    orderItems: {
      medicineId: number;
      quantity: number;
      price: number;
    }[]
  ): Promise<{ order: Order; items: InsertOrderItem[] }> {
    this.logger.log(`createOrder called with userId=${orderData.userId}`);
    
    try {
      return await this.databaseService.db.transaction(async (tx) => {
        // Calculate total amount
        const totalAmount = orderItems.reduce(
          (sum, item) => sum + (item.quantity * item.price),
          0
        );

        // Create order
        const [order] = await tx
          .insert(orders)
          .values({
            order_number: this.generateOrderNumber(),
            user_id: orderData.userId,
            pharmacy_id: orderData.pharmacyId,
            total_amount: totalAmount.toString(),
            status: 'PENDING',
            delivery_address: orderData.deliveryAddress,
            delivery_coordinates: orderData.deliveryCoordinates,
            payment_method: orderData.paymentMethod || 'CASH',
            payment_status: orderData.paymentIntentId ? 'PENDING' : 'NOT_PAID',
            payment_intent_id: orderData.paymentIntentId,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning();

        // Create order items
        const items = await Promise.all(
          orderItems.map(item => 
            tx.insert(order_items)
              .values({
                order_id: order.id,
                medicine_id: item.medicineId,
                quantity: item.quantity,
                unit_price: item.price.toString(),
                total_price: (item.quantity * item.price).toString()
              })
              .returning()
              .then(([result]) => result)
          )
        );

        return { order, items };
      });
    } catch (error) {
      this.logger.error('Error creating order', error.stack);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const randomPart = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${timestamp.slice(-6)}-${randomPart}`;
  }

  async updateOrderStatus(
    id: number,
    status: string,
    deliveryPersonId?: number,
    notes?: string,
    cancellationReason?: string
  ): Promise<Order> {
    this.logger.log(`updateOrderStatus called for order #${id}`);
    
    try {
      const validStatus = this.getValidOrderStatus(status);
      const updateData: Partial<Order> = {
        status: validStatus,
        updated_at: new Date(),
        ...(deliveryPersonId && { delivery_person_id: deliveryPersonId }),
        ...(validStatus === 'DELIVERED' && { actual_delivery_time: new Date() }),
      };

      // Handle notes and cancellation reason
      if (notes || cancellationReason) {
        updateData.review_comment = [
          notes && `Notes: ${notes}`,
          cancellationReason && `Cancellation reason: ${cancellationReason}`
        ].filter(Boolean).join('. ');
      }

      const [updatedOrder] = await this.databaseService.db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
        .returning();

      if (!updatedOrder) {
        throw new Error(`Order with ID ${id} not found`);
      }

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Failed to update order status`, error.stack);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  async getOrderWithDetails(id: number) {
    this.logger.log(`getOrderWithDetails called for order #${id}`);
    
    try {
      // Fetch order with all related data in parallel
      const [order, items, user, pharmacy, deliveryPerson] = await Promise.all([
        this.databaseService.db
          .select()
          .from(orders)
          .where(eq(orders.id, id))
          .limit(1)
          .then(res => res[0] || null),
        
        this.databaseService.db
          .select({
            id: order_items.id,
            medicine_id: order_items.medicine_id,
            medicine_name: medicines.name,
            medicine_generic_name: medicines.generic_name,
            medicine_manufacturer: medicines.manufacturer,
            requires_prescription: medicines.requires_prescription,
            quantity: order_items.quantity,
            unit_price: order_items.unit_price,
            total_price: order_items.total_price,
          })
          .from(order_items)
          .leftJoin(medicines, eq(order_items.medicine_id, medicines.id))
          .where(eq(order_items.order_id, id)),
        
        this.databaseService.db
          .select({
            id: users.id,
            username: users.username,
            phone: users.phone,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, sql`${orders.user_id}`))
          .limit(1)
          .then(res => res[0] || null),
        
        this.databaseService.db
          .select({
            id: pharmacies.id,
            name: pharmacies.name,
            address: pharmacies.address,
            phone: pharmacies.phone,
            email: pharmacies.email,
          })
          .from(pharmacies)
          .where(eq(pharmacies.id, sql`${orders.pharmacy_id}`))
          .limit(1)
          .then(res => res[0] || null),
        
        this.databaseService.db
          .select({
            id: users.id,
            username: users.username,
            phone: users.phone,
            profile_image: users.profile_image,
          })
          .from(users)
          .where(eq(users.id, sql`${orders.delivery_person_id}`))
          .limit(1)
          .then(res => res[0] || null)
      ]);

      if (!order) {
        return null;
      }

      return {
        ...order,
        items,
        user,
        pharmacy,
        deliveryPerson
      };
    } catch (error) {
      this.logger.error(`Error fetching order details`, error.stack);
      throw new Error(`Failed to fetch order details: ${error.message}`);
    }
  }

  async updatePaymentStatus(
    id: number, 
    paymentStatus: string, 
    paymentIntentId?: string
  ): Promise<Order> {
    this.logger.log(`updatePaymentStatus called for order #${id}`);
    
    try {
      const updateData: Partial<Order> = {
        payment_status: paymentStatus,
        updated_at: new Date(),
        ...(paymentIntentId && { payment_intent_id: paymentIntentId }),
        ...(paymentStatus === 'PAID' && { paid_at: new Date() }),
      };

      const [updatedOrder] = await this.databaseService.db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
        .returning();

      if (!updatedOrder) {
        throw new Error(`Order with ID ${id} not found`);
      }

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Failed to update payment status`, error.stack);
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  async updateDeliveryStatus(
  id: number,
  data: {
    location?: { lat: number; lng: number };
    estimatedTimeInMinutes?: number;
    deliveryStatus?: string;
    notes?: string;
  }
): Promise<Order> {
  this.logger.log(`updateDeliveryStatus called for order #${id}`);
  
  try {
    const updateData: Partial<Order> = { 
      updated_at: new Date(),
      ...(data.location && { delivery_coordinates: data.location }),
      ...(data.estimatedTimeInMinutes && { 
        expected_delivery_time: new Date(Date.now() + data.estimatedTimeInMinutes * 60 * 1000)
      }),
      ...(data.deliveryStatus && { status: this.getValidOrderStatus(data.deliveryStatus) }),
      ...(data.notes && { review_comment: data.notes })
    };

    const [updatedOrder] = await this.databaseService.db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      throw new Error(`Order with ID ${id} not found`);
    }

    return updatedOrder;
  } catch (error) {
    this.logger.error(`Failed to update delivery status`, error.stack);
    throw new Error(`Failed to update delivery status: ${error.message}`);
  }
}
}