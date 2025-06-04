export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  status: PharmacyStatus;
  createdAt: string;
  updatedAt: string;
  ownerId: number;
  ownerName?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  openingHours?: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  staffCount?: number;
  medicineCount?: number;
  activeOrders?: number;
  averageRating?: number;
}

export enum PharmacyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED'
}

export interface PharmacyListItem {
  id: number;
  name: string;
  city: string;
  status: PharmacyStatus;
  ownerName: string;
  createdAt: string;
  medicineCount: number;
  staffCount: number;
}

export interface PharmacyStaffMember {
  id: number;
  userId: number;
  pharmacyId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  position: string;
  createdAt: string;
}

export interface PharmacyStats {
  totalProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalSales: number;
  totalCustomers: number;
}