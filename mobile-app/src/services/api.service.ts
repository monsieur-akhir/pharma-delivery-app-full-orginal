import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://0.0.0.0:8000/api'; // Use 0.0.0.0 for Replit

export class ApiService {
  setToken(token: string) {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    delete this.instance.defaults.headers.common['Authorization'];
  }

  async requestOtp(phone: string, userType: string) {
    return this.post('/auth/request-otp', { phone, userType });
  }

  async login(phone: string, otp: string, userType: string) {
    return this.post('/auth/verify-otp', { phone, otp, userType });
  }

  async refreshToken() {
    return this.post('/auth/refresh-token');
  }

  async updateProfile(userData: any) {
    return this.put('/auth/profile', userData);
  }

  async logout() {
    return this.post('/auth/logout');
  }
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
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
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, logout user
          await AsyncStorage.multiRemove(['authToken', 'user']);
          Alert.alert('Session expirée', 'Veuillez vous reconnecter');
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete(url);
    return response.data;
  }

  async uploadFile<T>(url: string, file: FormData): Promise<T> {
    const response = await this.api.post(url, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export default new ApiService();