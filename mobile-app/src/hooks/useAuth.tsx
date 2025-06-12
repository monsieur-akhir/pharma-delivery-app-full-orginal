import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/api';

// Define the User type
interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  role: string;
  avatar_url?: string;
}

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  resendOtp: (phone: string) => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for stored user data on app startup
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Failed to load user data from storage', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Login function - sends OTP
  const login = async (phone: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await ApiService.auth.login(phone);

      if (response.data.status === 'success') {
        return { success: true, message: 'OTP sent successfully' };
      } else {
        return { success: false, message: response.data.message || 'Failed to send OTP' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Verify OTP function
  const verifyOtp = async (phone: string, otp: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await ApiService.auth.verifyOtp(phone, otp);

      if (response.data.status === 'success') {
        const { token, user: userData, isNewUser } = response.data.data;

        // Save auth token and user data
        await AsyncStorage.setItem('@auth_token', token);
        await AsyncStorage.setItem('@user_data', JSON.stringify(userData));

        // Update state
        setUser(userData);

        return { 
          success: true, 
          message: isNewUser ? 'Account created successfully' : 'Logged in successfully' 
        };
      } else {
        return { success: false, message: response.data.message || 'Invalid OTP' };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const resendOtp = async (phone: string): Promise<void> => {
    try {
      await ApiService.auth.login(phone);
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };


  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Clear storage
      await AsyncStorage.multiRemove(['@auth_token', '@user_data']);

      // Reset state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Create the auth context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    verifyOtp,
    logout,
    resendOtp,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';

export const useAuth = () => {
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  return {
    isAuthenticated,
    user,
    token,
    dispatch,
  };
};

export default useAuth;