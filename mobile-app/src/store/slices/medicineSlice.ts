import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';

interface MedicineState {
  medicines: any[];
  currentMedicine: any | null;
  pharmacies: any[];
  selectedPharmacy: any | null;
  searchQuery: string;
  searchResults: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MedicineState = {
  medicines: [],
  currentMedicine: null,
  pharmacies: [],
  selectedPharmacy: null,
  searchQuery: '',
  searchResults: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const searchMedicines = createAsyncThunk(
  'medicine/search',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/medicines/search?query=${query}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search medicines');
    }
  }
);

export const getMedicineById = createAsyncThunk(
  'medicine/getById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/medicines/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get medicine');
    }
  }
);

export const getNearbyPharmacies = createAsyncThunk(
  'medicine/getNearbyPharmacies',
  async (location: { latitude: number; longitude: number; radius?: number }, { rejectWithValue }) => {
    try {
      const { latitude, longitude, radius = 5 } = location;
      const response = await api.get(`/pharmacies/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get nearby pharmacies');
    }
  }
);

export const getPharmacyById = createAsyncThunk(
  'medicine/getPharmacyById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/pharmacies/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get pharmacy');
    }
  }
);

export const getPharmacyMedicines = createAsyncThunk(
  'medicine/getPharmacyMedicines',
  async ({ pharmacyId, query = '' }: { pharmacyId: number; query?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/pharmacies/${pharmacyId}/medicines?query=${query}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get pharmacy medicines');
    }
  }
);

// Slice
const medicineSlice = createSlice({
  name: 'medicine',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedPharmacy(state, action: PayloadAction<any>) {
      state.selectedPharmacy = action.payload;
    },
    resetMedicineError(state) {
      state.error = null;
    },
    clearSearchResults(state) {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    // Search Medicines
    builder.addCase(searchMedicines.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(searchMedicines.fulfilled, (state, action) => {
      state.isLoading = false;
      state.searchResults = action.payload;
    });
    builder.addCase(searchMedicines.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Medicine By ID
    builder.addCase(getMedicineById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getMedicineById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentMedicine = action.payload;
    });
    builder.addCase(getMedicineById.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Nearby Pharmacies
    builder.addCase(getNearbyPharmacies.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getNearbyPharmacies.fulfilled, (state, action) => {
      state.isLoading = false;
      state.pharmacies = action.payload;
    });
    builder.addCase(getNearbyPharmacies.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Pharmacy By ID
    builder.addCase(getPharmacyById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getPharmacyById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedPharmacy = action.payload;
    });
    builder.addCase(getPharmacyById.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Pharmacy Medicines
    builder.addCase(getPharmacyMedicines.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getPharmacyMedicines.fulfilled, (state, action) => {
      state.isLoading = false;
      state.medicines = action.payload;
    });
    builder.addCase(getPharmacyMedicines.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export const { 
  setSearchQuery, 
  setSelectedPharmacy, 
  resetMedicineError,
  clearSearchResults,
} = medicineSlice.actions;

export default medicineSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Medicine {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  manufacturer: string;
  inStock: boolean;
  stockQuantity: number;
  imageUrl?: string;
  prescriptionRequired: boolean;
}

interface MedicineState {
  medicines: Medicine[];
  searchResults: Medicine[];
  selectedMedicine: Medicine | null;
  categories: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
}

const initialState: MedicineState = {
  medicines: [],
  searchResults: [],
  selectedMedicine: null,
  categories: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
};

// Async thunks
export const fetchMedicines = createAsyncThunk(
  'medicine/fetchMedicines',
  async (params?: { category?: string; search?: string }) => {
    // API call would go here
    return [];
  }
);

export const searchMedicines = createAsyncThunk(
  'medicine/searchMedicines',
  async (query: string) => {
    // API call would go here
    return [];
  }
);

export const fetchMedicineDetails = createAsyncThunk(
  'medicine/fetchMedicineDetails',
  async (medicineId: string) => {
    // API call would go here
    return null;
  }
);

const medicineSlice = createSlice({
  name: 'medicine',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    setSelectedMedicine: (state, action: PayloadAction<Medicine | null>) => {
      state.selectedMedicine = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        state.loading = false;
        state.medicines = action.payload;
      })
      .addCase(fetchMedicines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch medicines';
      })
      .addCase(searchMedicines.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(fetchMedicineDetails.fulfilled, (state, action) => {
        state.selectedMedicine = action.payload;
      });
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  clearSearchResults,
  setSelectedMedicine,
  clearError,
} = medicineSlice.actions;

export default medicineSlice.reducer;
