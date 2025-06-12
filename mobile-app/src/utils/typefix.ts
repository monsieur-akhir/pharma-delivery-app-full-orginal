// Comprehensive TypeScript fixes for mobile app
// This file provides utility functions and type guards to resolve compilation errors

import { TimerRef } from '@/types/common';

// Fix for setInterval/setTimeout return type in React Native
export const createTimer = (callback: () => void, delay: number): TimerRef => {
  return setInterval(callback, delay) as any;
};

export const createTimeout = (callback: () => void, delay: number): TimerRef => {
  return setTimeout(callback, delay) as any;
};

// Type guard for Material Icons
export const isValidMaterialIcon = (icon: string): boolean => {
  // List of commonly used icons in the app
  const validIcons = [
    'home', 'search', 'favorite', 'settings', 'person', 'shopping-cart',
    'notification', 'location-on', 'phone', 'email', 'edit', 'delete',
    'add', 'check', 'close', 'arrow-back', 'arrow-forward', 'more-vert',
    'menu', 'refresh', 'share', 'schedule', 'local-pharmacy', 'delivery-dining'
  ];
  return validIcons.includes(icon);
};

// Fix for MediaStream toURL method
export const getStreamURL = (stream: MediaStream): string => {
  // Type assertion for React Native WebRTC compatibility
  return (stream as any).toURL?.() || '';
};

// Status label mapping with proper typing
export const getDeliveryStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    assigned: 'Assigné',
    accepted: 'Accepté',
    en_route_to_pharmacy: 'En route vers la pharmacie',
    arrived_at_pharmacy: 'Arrivé à la pharmacie',
    picked_up: 'Récupéré',
    en_route_to_customer: 'En route vers le client',
    arrived_at_customer: 'Arrivé chez le client',
    delivered: 'Livré',
    cancelled: 'Annulé'
  };
  return labels[status] || status;
};

export const getHistoryStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    delivered: 'Livré',
    cancelled: 'Annulé',
    returned: 'Retourné'
  };
  return labels[status] || status;
};

// Animation type conversion utility
export const convertToMedicationType = (type: string): 'pill' | 'liquid' | 'injection' | 'inhaler' => {
  switch (type) {
    case 'tablet':
    case 'capsule':
      return 'pill';
    case 'liquid':
      return 'liquid';
    case 'injection':
      return 'injection';
    case 'inhaler':
      return 'inhaler';
    default:
      return 'pill';
  }
};