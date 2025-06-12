export interface DeliveryItem {
  id: string;
  medicationName: string;
  quantity: number;
  dosage: string;
  price: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  status: 'assigned' | 'accepted' | 'en_route_to_pharmacy' | 'arrived_at_pharmacy' | 'picked_up' | 'en_route_to_customer' | 'arrived_at_customer' | 'delivered' | 'cancelled';
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  items: DeliveryItem[];
  totalAmount: number;
  type: 'standard' | 'express' | 'prescription';
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryEarnings {
  id: string;
  deliveryId: string;
  amount: number;
  date: string;
  type: 'standard' | 'express' | 'prescription';
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface ETAData {
  pickupAddress: string;
  deliveryAddress: string;
  currentLocation: LocationData;
}