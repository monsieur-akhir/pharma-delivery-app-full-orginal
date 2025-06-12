import { group } from "console";
import { generateKey } from "crypto";

export const COLORS = {
  primary: '#0C6B58',
  secondary: '#1E88E5',
  accent: '#FF6B35',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  white: '#FFFFFF',
  lightPrimary: '#E0F2F1',
  lightSecondary: '#BBDEFB',
  lightAccent: '#FFEBEE',
  lightBackground: '#FAFAFA',
  lightSurface: '#FFFFFF',
  darkPrimary: '#004D40',
  lightGray: '#F0F0F0',
  lightGray2: '#E8E8E8',
  darkBlue: '#0D47A1',
  darkGreen: '#004D40',
  darkGray: '#A0A0A0',
  black: '#000000',
  transparent: 'rgba(0, 0, 0, 0)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  disabled: '#BDBDBD',
  placeholder: '#B0BEC5',
  highlight: '#FFEB3B',
  link: '#1E88E5',
  danger: '#F44336',
  successLight: '#C8E6C9',
  warningLight: '#FFF3E0',
  errorLight: '#FFCDD2',
  infoLight: '#BBDEFB',
  gray:'#9E9E9E',
  grayLight: '#E0E0E0',
  grayDark: '#616161',


};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 8,
  padding: 16,
  margin: 16,

  // Font sizes
  largeTitle: 32,
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body1: 16,
  body2: 14,
  body3: 12,
  caption: 10,

  // App dimensions
  width: 375,
  height: 812,
  large:  24,
  medium: 20,
  small: 16,
  xSmall: 12,
  xLarge: 28,
  xXLarge: 32,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const API = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  VERSION: '/api/v1',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    verifyOtp: '/auth/verify-otp',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
  },
  user: {
    profile: '/users/profile',
    updateProfile: '/users/profile/update',
  },
  pharmacy: {
    list: '/pharmacies',
    nearby: '/pharmacies/nearby',
    details: (id: number) => `/pharmacies/${id}`,
  },
  medicine: {
    list: '/medicines',
    search: '/medicines/search',
    details: (id: number) => `/medicines/${id}`,
  },
  order: {
    create: '/orders',
    list: '/orders',
    details: (id: number) => `/orders/${id}`,
    cancel: (id: number) => `/orders/${id}/cancel`,
  },
  prescription: {
    upload: '/prescriptions/upload',
    list: '/prescriptions',
    details: (id: number) => `/prescriptions/${id}`,
  },
  reminders: {
    create: '/reminders',
    list: '/reminders',
    active: '/reminders/active',
    update: (id: number) => `/reminders/${id}`,
    delete: (id: number) => `/reminders/${id}`,
    markTaken: (id: number) => `/reminders/${id}/taken`,
  },
  payments: {
    createIntent: '/payments/create-intent',
    mobileMoneyInitiate: '/payments/mobile-money/initiate',
    mobileMoneyVerify: '/payments/mobile-money/verify',
  }
};

export const TIMEOUTS = {
  apiRequest: 10000, // 10 seconds
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000, // 30 seconds
  LONG: 60000 // 1 minute
};