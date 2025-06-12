import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { User } from '../store/slices/authSlice';
import { Dispatch, UnknownAction } from 'redux';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  dispatch: Dispatch<UnknownAction>;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  verifyOtp: (data: any) => Promise<void>;
  resendOtp: (phone: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    dispatch,
    login: async (credentials: any) => {
      console.log('login function called')
    },
    logout: () => {
      console.log('logout function called')
    },
    verifyOtp: async (data: any) => {
      console.log('verifyOtp function called')
    },
    resendOtp: async (phone: string) => {
      console.log('resendOtp function called')
    },
    isLoading: false,
    error: null,
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