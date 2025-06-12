
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../services/auth.service';

export interface User {
  id: number;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: string;
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

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ phone, password }: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(phone, password);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async ({ phone, userType }: { phone: string; userType: 'customer' | 'deliverer' }, { rejectWithValue }) => {
    try {
      const response = await authService.requestOtp(phone, userType);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send OTP');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, otp, userType }: { phone: string; otp: string; userType: 'customer' | 'deliverer' }, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOtp(phone, otp, userType);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'OTP verification failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return {};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      const token = await authService.getToken();
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get current user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Send OTP
    builder
      .addCase(sendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.user && action.payload.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setLoading, resetAuth } = authSlice.actions;
export const logout = authSlice.actions.logout;
export const resetError = authSlice.actions.resetError;
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (data: { phone: string; userType: 'customer' | 'deliverer' }) => {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (data: { phone: string; otp: string; userType: 'customer' | 'deliverer' }) => {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export default authSlice.reducer;
