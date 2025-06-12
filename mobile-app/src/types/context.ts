import { User } from './auth';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, otp: string, userType: 'customer' | 'deliverer') => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface LocationContextType {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  address: string | null;
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  setAddress: (address: string) => void;
  getCurrentLocation: () => Promise<void>;
}