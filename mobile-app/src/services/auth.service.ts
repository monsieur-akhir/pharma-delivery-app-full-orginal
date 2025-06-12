import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginResponse, SendOtpRequest, VerifyOtpRequest } from '../types/auth';
import { API_BASE_URL } from '../config';

class AuthService {
  private baseURL = API_BASE_URL;

  async sendOtp(request: SendOtpRequest): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async isCustomer(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'customer';
  }

  async isDeliveryPerson(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'delivery_person';
  }

  async verifyOtp(phone: string, otp: string, userType: 'customer' | 'deliverer'): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['authToken', 'user']);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();