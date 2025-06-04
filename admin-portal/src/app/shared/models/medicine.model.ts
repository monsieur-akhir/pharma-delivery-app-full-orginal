export interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  description: string;
  requires_prescription: boolean;
  price: number;
  stock: number;
}

export interface MedicineFilter {
  name?: string;
  category?: string;
  inStock?: boolean;
  pharmacyId?: number;
  page?: number;
  limit?: number;
}

export interface MedicineStats {
  total: number;
  lowStock: number;
  outOfStock: number;
  categories: { name: string; count: number }[];
}
