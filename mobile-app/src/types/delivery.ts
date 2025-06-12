export interface DeliveryItem {
  id: string;
  medicineId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  status: 'assigned' | 'accepted' | 'en_route_to_pharmacy' | 'arrived_at_pharmacy' | 'picked_up' | 'en_route_to_customer' | 'arrived_at_customer' | 'delivered' | 'cancelled';
  items: DeliveryItem[];
  customerPhone?: string;
  customerAddress?: string;
  pharmacyAddress?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStatusLabels {
  assigned: string;
  accepted: string;
  en_route_to_pharmacy: string;
  arrived_at_pharmacy: string;
  picked_up: string;
  en_route_to_customer: string;
  arrived_at_customer: string;
  delivered: string;
  cancelled: string;
}