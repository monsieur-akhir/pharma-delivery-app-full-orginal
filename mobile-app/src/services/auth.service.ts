import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginResponse {
  user: {
    id: number;
    phone: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role: string;
  };
  token: string;
  message: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
}

export interface User {
  id: number;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: string;
}

class AuthService {
  async login(phone: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', {
        phone,
        password,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('@auth_token', response.data.token);
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@user_data');
    }
  }

  async requestOtp(phone: string, userType: 'customer' | 'deliverer'): Promise<OtpResponse> {
    try {
      const response = await api.post('/auth/send-otp', {
        phone,
        userType,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  }

  async sendOtp(phone: string): Promise<void> {
    try {
      await apiService.post('/auth/send-otp', { phone });
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  isCustomer(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'customer';
  }

  isDeliveryPerson(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'delivery_person';
  }

  async verifyOtp(phone: string, otp: string, userType: 'customer' | 'deliverer'): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/verify-otp', {
        phone,
        otp,
        userType,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('@auth_token', response.data.token);
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      return null;
    }
  }

  async requestPasswordReset(phone: string): Promise<OtpResponse> {
    try {
      const response = await api.post('/auth/request-password-reset', {
        phone,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request password reset');
    }
  }

  async resetPassword(phone: string, otp: string, newPassword: string): Promise<OtpResponse> {
    try {
      const response = await api.post('/auth/reset-password', {
        phone,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  }

  async completeProfile(profileData: { name: string; email?: string }): Promise<User> {
    try {
      const response = await api.post('/auth/complete-profile', profileData);
      
      if (response.data.user) {
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data.user));
      }
      
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to complete profile');
    }
  }
}

const authService = new AuthService();
export { authService };
export default authService;