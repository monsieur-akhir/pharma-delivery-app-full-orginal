export interface Order {
  id: string;
  userId: string;
  pharmacyId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'delivered';
  items: OrderItem[];
  totalPrice: number;
  deliveryAddress: string;
  deliveryCoordinates?: { lat: number; lng: number };
  createdAt: Date;
  updatedAt: Date;
  estimatedDeliveryTime?: Date;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  price: number;
  name: string;
  productDetails?: any;
}
