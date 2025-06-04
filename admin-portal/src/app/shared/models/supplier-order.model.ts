export interface SupplierOrder {
  id: string;
  pharmacyId: string;
  supplierId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: SupplierOrderItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
}

export interface SupplierOrderItem {
  id: string;
  supplierOrderId: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  status: 'pending' | 'partial' | 'fulfilled' | 'backordered';
}
