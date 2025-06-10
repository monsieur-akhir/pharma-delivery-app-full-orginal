import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string) => Promise<boolean>;
  verifyOtp: (identifier: string, otp: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (userData && token) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any identifier
      if (identifier.trim()) {
        return true;
      } else {
        setError('Please enter a valid phone number or email');
        return false;
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (identifier: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any 4+ digit OTP
      if (otp.length >= 4) {
        const mockUser: UserProfile = {
          id: '1',
          username: 'Demo User',
          email: identifier.includes('@') ? identifier : 'demo@example.com',
          phone: identifier.includes('@') ? undefined : identifier,
        };
        
        const mockToken = 'demo-token-123';
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        await AsyncStorage.setItem('token', mockToken);
        
        setUser(mockUser);
        return true;
      } else {
        setError('Invalid OTP. Please try again.');
        return false;
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    verifyOtp,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};