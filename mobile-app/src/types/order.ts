export interface OrderItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  dosage: string;
}

export interface Order {
  id: string;
  customerId: string;
  pharmacyId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: 'card' | 'mobile_money' | 'cash';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  dosage: string;
  pharmacyId: string;
}