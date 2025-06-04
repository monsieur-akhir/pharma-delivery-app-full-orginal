import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: any | null;
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
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/send-otp', { phone });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (data: { phone: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-otp', data);
      
      // Save token to secure storage
      await AsyncStorage.setItem('token', response.data.token);
      
      // Set token in API headers for future requests
      api.setToken(response.data.token);
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify OTP');
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      // Get token from storage
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Set token in API headers
      api.setToken(token);
      
      // Get user profile
      const response = await api.get('/auth/profile');
      
      return { user: response.data, token };
    } catch (error: any) {
      // Clear invalid token
      await AsyncStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.message || 'Failed to load user');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/${profileData.id}`, profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Remove token from storage
      await AsyncStorage.removeItem('token');
      
      // Clear token in API
      api.clearToken();
      
      return true;
    } catch (error: any) {
      return rejectWithValue('Failed to logout');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Send OTP
    builder.addCase(sendOtp.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(sendOtp.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(sendOtp.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Verify OTP
    builder.addCase(verifyOtp.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(verifyOtp.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Load User
    builder.addCase(loadUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(loadUser.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
    });
    
    // Update Profile
    builder.addCase(updateProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
    });
  },
});

export const { resetError } = authSlice.actions;

export default authSlice.reducer;
