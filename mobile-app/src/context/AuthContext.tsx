import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { User } from '../store/slices/authSlice';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  dispatch: AppDispatch;
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