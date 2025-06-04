export enum UserRole {
  ADMIN = 'ADMIN',
  PHARMACY_OWNER = 'PHARMACY_OWNER',
  PHARMACY_STAFF = 'PHARMACY_STAFF',
  DELIVERY_PERSON = 'DELIVERY_PERSON',
  CUSTOMER = 'CUSTOMER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  name?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  token?: string;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  fullName?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserStats {
  totalOrders: number;
  activeOrders: number;
  totalPrescriptions: number;
  lastOrderDate?: Date;
  registeredSince: Date;
  totalSpent: number;
}