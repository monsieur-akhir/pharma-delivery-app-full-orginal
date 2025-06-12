
export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  fullName?: string;
  phone: string;
  email?: string;
  role: 'customer' | 'delivery_person' | 'admin';
  token?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profile?: UserProfile;
  preferences?: UserPreferences;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  emergencyContact?: string;
  medicalConditions?: string[];
  allergies?: string[];
  avatar?: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  isNewUser?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SendOtpRequest {
  phone: string;
  userType: 'customer' | 'deliverer';
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  userType: 'customer' | 'deliverer';
}
