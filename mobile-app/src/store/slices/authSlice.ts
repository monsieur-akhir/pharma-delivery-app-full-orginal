
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';

export interface User {
  id: number;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
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

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async ({ phone, userType }: { phone: string; userType: 'customer' | 'deliverer' }) => {
    return await authService.requestOtp(phone, userType);
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, otp, userType }: { phone: string; otp: string; userType: 'customer' | 'deliverer' }) => {
    return await authService.login(phone, otp, userType);
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async () => {
    return await authService.refreshToken();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    resetError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to send OTP';
      })
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Invalid OTP';
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
      });
  },
});

export const { setCredentials, logout, resetError, setLoading } = authSlice.actions;
export default authSlice.reducer;
