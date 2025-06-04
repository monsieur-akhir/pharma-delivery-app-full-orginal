import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, TIMEOUTS } from '../constants';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API.baseURL,
  timeout: TIMEOUTS.apiRequest,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration/invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Could implement token refresh here
      // For now, redirect to login
      await AsyncStorage.removeItem('@auth_token');
      // Navigation to login would be handled by the auth context
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// API service functions
export const ApiService = {
  // Auth
  auth: {
    login: async (phone: string) => {
      return api.post(API.auth.login, { phone });
    },
    verifyOtp: async (phone: string, otp: string) => {
      return api.post(API.auth.verifyOtp, { phone, otp });
    },
  },
  
  // Payments
  payments: {
    createPaymentIntent: async (userId: number, orderId: number, amount: number) => {
      return api.post(API.payments.createIntent, { userId, orderId, amount });
    },
    mobileMoneyInitiate: async (
      userId: number, 
      orderId: number, 
      amount: number, 
      provider: string, 
      phoneNumber: string
    ) => {
      return api.post(API.payments.mobileMoneyInitiate, {
        userId,
        orderId,
        amount,
        provider,
        phoneNumber,
        currency: 'XOF',
      });
    },
    mobileMoneyVerify: async (transactionReference: string, orderId: number) => {
      return api.post(API.payments.mobileMoneyVerify, {
        transactionReference,
        orderId,
      });
    },
    getMobileMoneyProviders: async () => {
      return api.get('/api/payments/mobile-money/providers');
    },
  },
};

export default ApiService;