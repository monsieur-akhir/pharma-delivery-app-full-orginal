// API Configuration
export const API_URL = 'http://localhost:8000/api';

// App Configuration
export const APP_NAME = 'Medi-Delivery';

// Geolocation Configuration
export const LOCATION_TRACKING_OPTIONS = {
  accuracy: 6, // high accuracy
  distanceInterval: 10, // update every 10 meters
  timeInterval: 5000, // or every 5 seconds
};

// Notification Configuration
export const REMINDER_NOTIFICATION_CHANNEL = {
  name: 'medication-reminders',
  importance: 5, // highest
  sound: true,
  vibration: true,
};

// Prescription Scan Configuration
export const OCR_MIN_CONFIDENCE = 0.7; // minimum confidence level for OCR detection
export const SUPPORTED_LANGUAGES = ['eng', 'fra']; // English and French

// Misc Configuration
export const TERMS_URL = 'https://example.com/terms';
export const PRIVACY_URL = 'https://example.com/privacy';