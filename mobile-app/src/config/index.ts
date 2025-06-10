export const APP_NAME = 'MediConnect';
export const API_BASE_URL = 'http://localhost:3000/api';
export const SOCKET_URL = 'http://localhost:3000';

export const CONFIG = {
  APP_NAME: 'MediConnect',
  VERSION: '1.0.0',
  API_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    VERIFY_OTP: '/auth/verify-otp',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  PHARMACY: {
    LIST: '/pharmacies',
    DETAILS: '/pharmacies/:id',
    SEARCH: '/pharmacies/search',
  },
  MEDICATIONS: {
    LIST: '/medications',
    SEARCH: '/medications/search',
    DETAILS: '/medications/:id',
  },
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    DETAILS: '/orders/:id',
    TRACK: '/orders/:id/track',
  },
};