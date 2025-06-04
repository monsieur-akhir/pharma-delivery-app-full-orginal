import axios from 'axios';
import { API_URL } from '../config';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API endpoints
export const AuthApi = {
  sendOtp: (identifier, channel) => 
    api.post('/auth/send-otp', { identifier, channel }),
  
  verifyOtp: (identifier, otp) => 
    api.post('/auth/verify-otp', { identifier, otp }),
  
  requestPasswordReset: (identifier, channel) => 
    api.post('/auth/request-password-reset', { identifier, channel }),
  
  verifyPasswordReset: (identifier, resetCode, newPassword) => 
    api.post('/auth/verify-password-reset', { identifier, resetCode, newPassword }),
};

// User API endpoints
export const UserApi = {
  getUserProfile: () =>
    api.get('/users/me'),

  updateUserProfile: (userData) =>
    api.put('/users/me/profile', userData),
  
  updateUserSettings: (settings) => 
    api.put('/users/settings', settings),
};

// Pharmacy API endpoints
export const PharmacyApi = {
  getNearbyPharmacies: (latitude, longitude, radius) => 
    api.get(`/pharmacies/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`),
  
  getPharmacyDetails: (pharmacyId) => 
    api.get(`/pharmacies/${pharmacyId}`),
  
  getPharmacyMedicines: (pharmacyId) => 
    api.get(`/pharmacies/${pharmacyId}/medicines`),
};

// Medicine API endpoints
export const MedicineApi = {
  searchMedicines: (query) => 
    api.get(`/medicines/search?q=${query}`),
  
  getMedicineDetails: (medicineId) => 
    api.get(`/medicines/${medicineId}`),
};

// Order API endpoints
export const OrderApi = {
  createOrder: (orderData) => 
    api.post('/orders', orderData),
  
  getUserOrders: () => 
    api.get('/orders'),
  
  getOrderDetails: (orderId) => 
    api.get(`/orders/${orderId}`),
  
  trackOrder: (orderId) => 
    api.get(`/orders/${orderId}/tracking`),
};

// Prescription API endpoints
export const PrescriptionApi = {
  uploadPrescription: (formData) => 
    api.post('/prescriptions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getUserPrescriptions: () => 
    api.get('/prescriptions'),
  
  getPrescriptionDetails: (prescriptionId) => 
    api.get(`/prescriptions/${prescriptionId}`),
};

// Chat API endpoints
export const ChatApi = {
  getUserMessages: () => 
    api.get('/messages'),
  
  getConversation: (userId, pharmacyId) => 
    api.get(`/messages/conversation?userId=${userId}&pharmacyId=${pharmacyId}`),
  
  sendMessage: (messageData) => 
    api.post('/messages', messageData),
};

// Payment API endpoints
export const PaymentApi = {
  createPaymentIntent: (amount, currency = 'usd') => 
    api.post('/payments/create-intent', { amount, currency }),
  
  confirmPayment: (paymentIntentId) => 
    api.post('/payments/confirm', { paymentIntentId }),
};

// Reminder API endpoints
export const ReminderApi = {
  getUserReminders: () => 
    api.get('/reminders'),
  
  createReminder: (reminderData) => 
    api.post('/reminders', reminderData),
  
  updateReminder: (reminderId, reminderData) => 
    api.put(`/reminders/${reminderId}`, reminderData),
  
  deleteReminder: (reminderId) => 
    api.delete(`/reminders/${reminderId}`),
};

// Health API endpoints
export const HealthApi = {
  checkHealth: () => 
    api.get('/health'),
};

// Error interceptor
api.interceptors.response.use(
  response => response,
  error => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Redirect to login or refresh token logic
      console.log('Session expired, please login again');
    }
    return Promise.reject(error);
  }
);

// Add token to request if available
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default api;