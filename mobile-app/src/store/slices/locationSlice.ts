import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LocationState {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  currentLocation: null,
  address: null,
  isLoading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      state.currentLocation = action.payload;
    },
    setAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCurrentLocation, setAddress, setLoading, setError } = locationSlice.actions;

// Export getCurrentLocation as a selector function
export const getCurrentLocation = createAsyncThunk(
  'location/getCurrentLocation',
  async () => {
    // Implementation pour récupérer la position actuelle
    return new Promise<{latitude: number; longitude: number}>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }
);

export default locationSlice.reducer;