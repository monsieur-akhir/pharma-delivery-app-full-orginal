import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../../services/auth.service';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state: AuthState) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state: AuthState, action: PayloadAction<{ user: UserProfile; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state: AuthState, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logoutUser: (state: AuthState) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    refreshToken: (state: AuthState, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    updateUserProfile: (state: AuthState, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
    },
    clearError: (state: AuthState) => {
      state.error = null;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutUser,
  refreshToken,
  updateUserProfile,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;