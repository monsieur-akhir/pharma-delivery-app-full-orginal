export interface User {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  role: 'customer' | 'deliverer' | 'pharmacist' | 'admin';
  isVerified: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  otpId?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, otp: string, userType: 'customer' | 'deliverer') => Promise<LoginResponse>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface ProfileData {
  name: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}