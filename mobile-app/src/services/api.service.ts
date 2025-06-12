
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('@token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.multiRemove(['@token', '@user']);
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url);
    return response.data;
  }

  // Auth specific methods
  async requestOtp(phone: string, userType: string): Promise<any> {
    return this.post('/auth/request-otp', { phone, userType });
  }

  async login(phone: string, otp: string, userType: string): Promise<any> {
    return this.post('/auth/verify-otp', { phone, otp, userType });
  }

  async refreshToken(): Promise<any> {
    return this.post('/auth/refresh-token');
  }

  async updateProfile(userData: any): Promise<any> {
    return this.put('/auth/profile', userData);
  }

  async logout(): Promise<any> {
    return this.post('/auth/logout');
  }
}

export const apiService = new ApiService();
export default apiService;
