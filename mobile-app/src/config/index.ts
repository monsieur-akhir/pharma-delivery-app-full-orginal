
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const COLORS = {
  primary: '#0C6B58',
  secondary: '#FFA726',
  accent: '#FF5722',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#E0E0E0',
  lightGray2: '#F5F5F5',
  darkGray: '#424242',
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 8,
  padding: 16,
  margin: 16,
  h1: 30,
  h2: 24,
  h3: 18,
  h4: 16,
  body1: 16,
  body2: 14,
  body3: 12,
  caption: 10,
};

export const STORAGE_KEYS = {
  USER: '@user',
  TOKEN: '@token',
  ONBOARDING: '@onboarding_complete',
  LANGUAGE: '@language',
  THEME: '@theme',
  NOTIFICATION_SETTINGS: '@notification_settings',
  CART: '@cart',
  FAVORITES: '@favorites',
  SEARCH_HISTORY: '@search_history',
};

export const VITE_STRIPE_PUBLIC_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '';
