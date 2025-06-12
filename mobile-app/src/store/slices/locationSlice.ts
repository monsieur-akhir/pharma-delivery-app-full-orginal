import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Location from 'expo-location';

interface LocationState {
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  currentLocation: null,
  permissionStatus: 'undetermined',
  isLoading: false,
  error: null,
};

// Async thunks
export const requestLocationPermission = createAsyncThunk(
  'location/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to request location permission');
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'location/getCurrent',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Check permission status first
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        // Request permission if not granted
        const permissionResult = await dispatch(requestLocationPermission());

        if (permissionResult.payload !== 'granted') {
          return rejectWithValue('Location permission not granted');
        }
      }

      // Get location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get address for the location
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = address[0]
        ? `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}`
        : undefined;

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: formattedAddress,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get current location');
    }
  }
);

// Slice
const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation(state, action: PayloadAction<any>) {
      state.currentLocation = action.payload;
    },
    resetLocationError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Request Location Permission
    builder.addCase(requestLocationPermission.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(requestLocationPermission.fulfilled, (state, action) => {
      state.isLoading = false;
      state.permissionStatus = action.payload as 'granted' | 'denied';
    });
    builder.addCase(requestLocationPermission.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Get Current Location
    builder.addCase(getCurrentLocation.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getCurrentLocation.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentLocation = {
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
        address: action.payload.address || '',
      };
    });
    builder.addCase(getCurrentLocation.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export const { setLocation, resetLocationError } = locationSlice.actions;

export default locationSlice.reducer;