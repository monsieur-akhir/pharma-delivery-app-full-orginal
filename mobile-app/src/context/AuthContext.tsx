import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

type User = {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: string;
  token: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string) => Promise<boolean>;
  verifyOtp: (identifier: string, otp: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored user data on startup
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  const login = async (identifier: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          identifier,
          channel: 'both' // Request OTP via both email and SMS if available
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      console.log('OTP sent successfully');
      setIsLoading(false);
      return true;
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e.message || 'An error occurred during login');
      setIsLoading(false);
      return false;
    }
  };

  const verifyOtp = async (identifier: string, otp: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, otp }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }
      
      // Save the user data including the JWT token
      setUser(data);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      
      setIsLoading(false);
      return true;
    } catch (e: any) {
      console.error('OTP verification error:', e);
      setError(e.message || 'Invalid OTP');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Optional: Call logout API endpoint
      if (user?.token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      // Remove user data from storage
      setUser(null);
      await AsyncStorage.removeItem('user');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyOtp, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};