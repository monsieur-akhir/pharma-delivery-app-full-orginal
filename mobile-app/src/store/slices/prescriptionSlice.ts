import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import * as FileSystem from 'expo-file-system';

interface PrescriptionState {
  prescriptions: any[];
  currentPrescription: any | null;
  previewImage: string | null;
  ocrResult: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PrescriptionState = {
  prescriptions: [],
  currentPrescription: null,
  previewImage: null,
  ocrResult: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const uploadPrescription = createAsyncThunk(
  'prescription/upload',
  async ({ 
    uri, 
    orderId 
  }: { 
    uri: string; 
    orderId?: number 
  }, { rejectWithValue }) => {
    try {
      // Create form data
      const formData = new FormData();
      
      // Get file name from URI
      const fileName = uri.split('/').pop() || 'prescription.jpg';
      
      // Append file to form data
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
      
      // Append order ID if provided
      if (orderId) {
        formData.append('orderId', orderId.toString());
      }
      
      // Upload prescription
      const response = await api.post('/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload prescription');
    }
  }
);

export const getMyPrescriptions = createAsyncThunk(
  'prescription/getMyPrescriptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/prescriptions/my-prescriptions');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch prescriptions');
    }
  }
);

export const getPrescriptionById = createAsyncThunk(
  'prescription/getById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch prescription');
    }
  }
);

export const getOrderPrescriptions = createAsyncThunk(
  'prescription/getOrderPrescriptions',
  async (orderId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/prescriptions/order/${orderId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order prescriptions');
    }
  }
);

// Slice
const prescriptionSlice = createSlice({
  name: 'prescription',
  initialState,
  reducers: {
    setPreviewImage(state, action: PayloadAction<string | null>) {
      state.previewImage = action.payload;
    },
    setOcrResult(state, action: PayloadAction<string | null>) {
      state.ocrResult = action.payload;
    },
    resetPrescriptionError(state) {
      state.error = null;
    },
    clearPrescriptionData(state) {
      state.previewImage = null;
      state.ocrResult = null;
      state.currentPrescription = null;
    },
  },
  extraReducers: (builder) => {
    // Upload Prescription
    builder.addCase(uploadPrescription.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(uploadPrescription.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentPrescription = action.payload;
      state.prescriptions.unshift(action.payload);
    });
    builder.addCase(uploadPrescription.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get My Prescriptions
    builder.addCase(getMyPrescriptions.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getMyPrescriptions.fulfilled, (state, action) => {
      state.isLoading = false;
      state.prescriptions = action.payload.items || action.payload;
    });
    builder.addCase(getMyPrescriptions.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Prescription By ID
    builder.addCase(getPrescriptionById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getPrescriptionById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentPrescription = action.payload;
    });
    builder.addCase(getPrescriptionById.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Order Prescriptions
    builder.addCase(getOrderPrescriptions.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getOrderPrescriptions.fulfilled, (state, action) => {
      state.isLoading = false;
      state.prescriptions = action.payload;
    });
    builder.addCase(getOrderPrescriptions.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export const {
  setPreviewImage,
  setOcrResult,
  resetPrescriptionError,
  clearPrescriptionData,
} = prescriptionSlice.actions;

export default prescriptionSlice.reducer;
