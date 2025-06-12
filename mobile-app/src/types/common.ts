// Common component prop types
export interface NavigationProps {
  navigation: any;
  route?: any;
}

// Material Icons type (extended for common icons used in the app)
export type MaterialIconName = 
  | 'home' | 'search' | 'favorite' | 'settings' | 'person' 
  | 'shopping-cart' | 'notification' | 'location-on' | 'phone'
  | 'email' | 'edit' | 'delete' | 'add' | 'check' | 'close'
  | 'arrow-back' | 'arrow-forward' | 'more-vert' | 'more-horiz'
  | 'menu' | 'refresh' | 'share' | 'download' | 'upload'
  | 'star' | 'star-border' | 'thumb-up' | 'thumb-down'
  | 'visibility' | 'visibility-off' | 'lock' | 'lock-open'
  | 'calendar-today' | 'schedule' | 'timer' | 'alarm'
  | 'local-pharmacy' | 'medical-services' | 'health-and-safety'
  | 'delivery-dining' | 'drive-eta' | 'directions' | 'map'
  | 'payment' | 'credit-card' | 'account-balance-wallet'
  | 'chat' | 'video-call' | 'call' | 'message'
  | 'photo-camera' | 'photo-library' | 'attach-file'
  | 'info' | 'warning' | 'error' | 'check-circle'
  | 'cancel' | 'help' | 'support' | 'feedback';

// Generic API response type
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Generic pagination type
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Timer reference type for React Native
export type TimerRef = NodeJS.Timeout | null;