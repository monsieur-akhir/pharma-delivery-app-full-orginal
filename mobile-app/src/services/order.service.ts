import api from './api.service';
import authService from './auth.service';

/**
 * Interface for medicine items
 */
export interface Medicine {
  id: number;
  name: string;
  description: string;
  dosage: string;
  category: string;
  requiresPrescription: boolean;
  price: number;
  imageUrl?: string;
  inStock: boolean;
  stockCount?: number;
}

/**
 * Interface for order items
 */
export interface OrderItem {
  id?: number;
  medicineId: number;
  medicine?: Medicine;
  quantity: number;
  price: number;
  subtotal?: number;
  prescriptionRequired?: boolean;
  prescriptionImageId?: number;
}

/**
 * Interface for orders
 */
export interface Order {
  id?: number;
  userId?: number;
  pharmacyId: number;
  pharmacyName?: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: 'cash' | 'card' | 'insurance';
  deliveryStatus?: string;
  trackingCode?: string;
  estimatedDeliveryTime?: string;
}

/**
 * Service for handling orders
 */
class OrderService {
  /**
   * Get all available medicines
   */
  async getMedicines(searchQuery: string = '', categoryFilter: string = ''): Promise<Medicine[]> {
    try {
      const params: Record<string, string> = {};
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      
      const response = await api.get('/medicines', { params });
      return response.data.medicines;
    } catch (error) {
      console.error('Error fetching medicines:', error);
      throw error;
    }
  }
  
  /**
   * Get medicine categories
   */
  async getMedicineCategories(): Promise<string[]> {
    try {
      const response = await api.get('/medicines/categories');
      return response.data.categories;
    } catch (error) {
      console.error('Error fetching medicine categories:', error);
      throw error;
    }
  }

  /**
   * Create a new order
   */
  async createOrder(order: Order): Promise<Order> {
    try {
      const response = await api.post('/orders', order);
      return response.data.order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
  
  /**
   * Get customer orders
   */
  async getMyOrders(status: string = ''): Promise<Order[]> {
    try {
      if (!authService.isCustomer()) {
        throw new Error('Insufficient permissions: customer access required');
      }
      
      const params = status ? { status } : {};
      const response = await api.get('/orders/my-orders', { params });
      return response.data.orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }
  
  /**
   * Get order details
   */
  async getOrderDetails(orderId: number): Promise<Order> {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.order;
    } catch (error) {
      console.error(`Error fetching order #${orderId} details:`, error);
      throw error;
    }
  }
  
  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number, reason: string): Promise<any> {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error canceling order #${orderId}:`, error);
      throw error;
    }
  }
  
  /**
   * Upload prescription image
   */
  async uploadPrescription(file: any): Promise<{ id: number, url: string }> {
    try {
      const formData = new FormData();
      formData.append('prescription', file);
      
      const response = await api.post('/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.prescription;
    } catch (error) {
      console.error('Error uploading prescription:', error);
      throw error;
    }
  }
  
  /**
   * Track order delivery
   */
  async trackDelivery(orderId: number): Promise<any> {
    try {
      const response = await api.get(`/orders/${orderId}/track`);
      return response.data;
    } catch (error) {
      console.error(`Error tracking order #${orderId}:`, error);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService;