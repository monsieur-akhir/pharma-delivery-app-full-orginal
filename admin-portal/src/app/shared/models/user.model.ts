export interface User {
  id: string;
  username: string;
  email?: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN' | 'PHARMACY_STAFF' | 'PHARMACIST' | 'DELIVERY_PERSON' | 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT' | 'VIEWER';
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  pharmacyId?: string;
}

export interface UserFilter {
  role?: string;
  status?: string;
  pharmacyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  customers: number;
  pharmacyStaff: number;
  deliveryPersonnel: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  growthRate: number;
}
