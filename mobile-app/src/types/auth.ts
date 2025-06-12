export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  username?: string;
  fullName?: string;
  token?: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'pharmacist' | 'delivery_person' | 'admin';
  isVerified?: boolean;
  preferences?: UserPreferences;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  isNewUser?: boolean;
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