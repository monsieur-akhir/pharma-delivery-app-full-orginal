
// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'deliverer' | 'pharmacist' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  avatar?: string;
  address?: Address;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Address types
export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: Coordinates;
  isDefault?: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Pharmacy types
export interface Pharmacy {
  id: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  distance?: number;
  services: PharmacyService[];
  workingHours: WorkingHours[];
}

export interface PharmacyService {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export interface WorkingHours {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// Medicine types
export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  description: string;
  price: number;
  category: string;
  manufacturer: string;
  inStock: boolean;
  stockQuantity: number;
  imageUrl?: string;
  prescriptionRequired: boolean;
  dosageForm: string;
  strength: string;
  sideEffects?: string[];
  contraindications?: string[];
}

// Order types
export interface Order {
  id: string;
  userId: string;
  pharmacyId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  prescriptionId?: string;
  deliveryId?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  medicineId: string;
  medicine: Medicine;
  quantity: number;
  price: number;
  total: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'cash';
  details: CardDetails | MobileMoneyDetails | null;
  isDefault: boolean;
}

export interface CardDetails {
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
}

export interface MobileMoneyDetails {
  phoneNumber: string;
  provider: 'orange' | 'mtn' | 'moov';
}

// Prescription types
export interface Prescription {
  id: string;
  userId: string;
  pharmacyId?: string;
  imageUrl: string;
  status: PrescriptionStatus;
  analysisResult?: PrescriptionAnalysis;
  medicines?: PrescriptionMedicine[];
  doctorName?: string;
  prescriptionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PrescriptionStatus = 
  | 'uploaded'
  | 'analyzing'
  | 'analyzed'
  | 'verified'
  | 'rejected'
  | 'filled';

export interface PrescriptionAnalysis {
  confidence: number;
  extractedText: string;
  identifiedMedicines: string[];
  dosageInstructions: string[];
  warnings: string[];
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  medicineId?: string;
}

// Reminder types
export interface MedicationReminder {
  id: string;
  userId: string;
  medicationName: string;
  dosage: string;
  frequency: ReminderFrequency;
  times: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
  adherenceHistory: AdherenceRecord[];
  createdAt: string;
  updatedAt: string;
}

export type ReminderFrequency = 
  | 'once'
  | 'daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'weekly'
  | 'custom';

export interface AdherenceRecord {
  id: string;
  reminderId: string;
  scheduledTime: string;
  takenTime?: string;
  status: 'taken' | 'missed' | 'delayed';
  notes?: string;
}

// Delivery types
export interface Delivery {
  id: string;
  orderId: string;
  delivererId?: string;
  status: DeliveryStatus;
  pickupAddress: Address;
  deliveryAddress: Address;
  estimatedPickupTime?: string;
  actualPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  trackingUpdates: TrackingUpdate[];
  deliveryInstructions?: string;
  deliveryFee: number;
}

export type DeliveryStatus = 
  | 'assigned'
  | 'accepted'
  | 'picking_up'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface TrackingUpdate {
  id: string;
  status: DeliveryStatus;
  location?: Coordinates;
  address?: string;
  timestamp: string;
  notes?: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'order_update'
  | 'delivery_update'
  | 'prescription_update'
  | 'reminder'
  | 'promotion'
  | 'system';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: { phone: string };
  Home: undefined;
  Pharmacies: undefined;
  PharmacyDetail: { pharmacyId: string };
  MedicineDetail: { medicineId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  Orders: undefined;
  OrderDetail: { orderId: string };
  PrescriptionUpload: undefined;
  PrescriptionDetail: { prescriptionId: string };
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
  VideoConsultation: { pharmacyId?: string };
  Chat: { recipientId: string; recipientName: string };
  DeliveryDashboard: undefined;
  DeliveryDetail: { deliveryId: string };
  ActiveDelivery: { deliveryId: string };
};

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface OtpForm {
  code: string;
}

export interface AddressForm {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentCardForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  holderName: string;
}

export interface MobileMoneyForm {
  phoneNumber: string;
  provider: 'orange' | 'mtn' | 'moov';
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}
