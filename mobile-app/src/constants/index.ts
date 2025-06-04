// Application constants

// Colors
export const COLORS = {
  primary: '#3F51B5', // Primary color (Indigo)
  secondary: '#F44336', // Secondary color (Red)
  accent: '#FF9800', // Accent color (Orange)

  success: '#4CAF50', // Success color (Green)
  error: '#F44336', // Error color (Red)
  warning: '#FFC107', // Warning color (Amber)
  info: '#2196F3', // Info color (Blue)

  white: '#FFFFFF',
  black: '#000000',
  text: '#333333',
  
  gray: '#888888',
  lightGray: '#D3D3D3',
  lightGray2: '#F5F5F5',
  
  lightPrimary: 'rgba(63, 81, 181, 0.1)', // Light primary for backgrounds
  
  transparent: 'transparent',
};

// Typography
export const FONTS = {
  regular: 'System',
  medium: 'System-Medium',
  bold: 'System-Bold',
  light: 'System-Light',
};

// Sizing and spacing
export const SIZES = {
  // Base sizing
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  
  // Padding and margins
  padding: 16,
  radius: 12,
  
  // Screen dimensions
  width: 1080, // Use actual device width in practice
  height: 1920, // Use actual device height in practice
};

// API endpoints
export const API = {
  baseURL: 'https://api.pharmamobileapp.com', // Change this to your actual API URL
  
  // Auth endpoints
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    verifyOtp: '/api/auth/verify-otp',
  },
  
  // Payments endpoints
  payments: {
    createIntent: '/api/payments/create-payment-intent',
    mobileMoneyInitiate: '/api/payments/mobile-money/initiate',
    mobileMoneyVerify: '/api/payments/mobile-money/verify',
  },
};

// Timeout durations
export const TIMEOUTS = {
  apiRequest: 30000, // 30 seconds timeout for API requests
  otpVerification: 120000, // 2 minutes for OTP verification
  paymentVerification: 300000, // 5 minutes for payment verification
};

// App-wide constants
export const APP_CONSTANTS = {
  appName: 'PharmaDelivery',
  appVersion: '1.0.0',
  defaultCurrency: 'XOF',
  defaultLanguage: 'fr',
  defaultCountryCode: 'CI', // Côte d'Ivoire as default
};

// Export all constants as a single object
export default {
  COLORS,
  FONTS,
  SIZES,
  API,
  TIMEOUTS,
  APP_CONSTANTS,
};