
// API Configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com/api'
  : 'http://localhost:8000/api';

// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';

// App Configuration
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Medi-Delivery';

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@user_token',
  USER_DATA: '@user_data',
  SETTINGS: '@settings',
  CART: '@cart',
} as const;

// Notification Settings
export const NOTIFICATION_CHANNELS = {
  REMINDERS: 'medication-reminders',
  ORDERS: 'order-updates',
  GENERAL: 'general-notifications',
} as const;

// Map Configuration
export const MAP_SETTINGS = {
  DEFAULT_LATITUDE: 14.6928,
  DEFAULT_LONGITUDE: -17.4467,
  DEFAULT_DELTA: 0.0922,
} as const;

// Colors
export const COLORS = {
  PRIMARY: '#4A80F0',
  SECONDARY: '#0C6B58',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9500',
  ERROR: '#FF4757',
  BACKGROUND: '#F8F9FF',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_LIGHT: '#F5F5F5',
  GRAY_MEDIUM: '#CCCCCC',
  GRAY_DARK: '#666666',
} as const;

// Timing
export const TIMEOUTS = {
  API_REQUEST: 30000,
  SHORT_DELAY: 1000,
  MEDIUM_DELAY: 3000,
  LONG_DELAY: 5000,
} as const;

export default {
  API_BASE_URL,
  STRIPE_PUBLISHABLE_KEY,
  APP_VERSION,
  APP_NAME,
  STORAGE_KEYS,
  NOTIFICATION_CHANNELS,
  MAP_SETTINGS,
  COLORS,
  TIMEOUTS,
};
