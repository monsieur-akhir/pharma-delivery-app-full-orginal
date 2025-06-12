export * from './constants';
export { default } from './constants';

// Re-export commonly used config values
export { API_BASE_URL, COLORS, STORAGE_KEYS } from './constants';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
export const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_KEY || '';
export const VITE_STRIPE_PUBLIC_KEY = process.env.EXPO_PUBLIC_STRIPE_KEY || '';

export const COLORS = {
  primary: '#0C6B58',
  secondary: '#F4A261',
  accent: '#E76F51',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#343A40',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8'
};