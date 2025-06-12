// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// App Configuration
export const APP_NAME = 'Medi-Delivery';
export const APP_VERSION = '1.0.0';

// Location Configuration
export const LOCATION_TRACKING_OPTIONS = {
  accuracy: 'high',
  distanceInterval: 10, // meters
  timeInterval: 10000, // milliseconds (10 seconds)
};

// Notification Configuration
export const REMINDER_NOTIFICATION = {
  channelId: 'medication-reminders',
  channelName: 'Medication Reminders',
  channelDescription: 'Notifications for medication reminders',
};

// OCR Configuration
export const OCR_MIN_CONFIDENCE = 0.7;
export const SUPPORTED_LANGUAGES = ['eng', 'fra']; // English and French

// Stripe Configuration
export const STRIPE_PUBLIC_KEY = process.env.EXPO_PUBLIC_STRIPE_KEY || '';
export const VITE_STRIPE_PUBLIC_KEY = STRIPE_PUBLIC_KEY;
export const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';

// Legal URLs
export const TERMS_URL = 'https://example.com/terms';
export const PRIVACY_URL = 'https://example.com/privacy';