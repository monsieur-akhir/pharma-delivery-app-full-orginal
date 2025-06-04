import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';

interface OrderState {
  orders: any[];
  activeOrders: any[];
  currentOrder: any | null;
  cart: {
    items: any[];
    pharmacyId: number | null;
    deliveryType: string | null;
    deliveryAddress: any | null;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  activeOrders: [],
  currentOrder: null,
  cart: {
    items: [],
    pharmacyId: null,
    deliveryType: null,
    deliveryAddress: null,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const createOrder = createAsyncThunk(
  'order/create',
  async (orderData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const getMyOrders = createAsyncThunk(
  'order/getMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/my-orders');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const getActiveOrders = createAsyncThunk(
  'order/getActiveOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/active');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active orders');
    }
  }
);

export const getOrderById = createAsyncThunk(
  'order/getById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateStatus',
  async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

export const updateOrderTracking = createAsyncThunk(
  'order/updateTracking',
  async (
    { 
      id, 
      trackingInfo 
    }: { 
      id: number; 
      trackingInfo: { currentLatitude: number; currentLongitude: number } 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(`/orders/${id}/tracking`, trackingInfo);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tracking info');
    }
  }
);

export const addOrderReview = createAsyncThunk(
  'order/addReview',
  async (
    { 
      id, 
      review 
    }: { 
      id: number; 
      review: { rating: number; reviewComment: string } 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/orders/${id}/review`, review);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add review');
    }
  }
);

// Slice
const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<any>) {
      const { item, pharmacyId } = action.payload;
      
      // Ensure we only have items from the same pharmacy
      if (state.cart.pharmacyId && state.cart.pharmacyId !== pharmacyId) {
        // Replace cart with new pharmacy and item
        state.cart = {
          items: [item],
          pharmacyId,
          deliveryType: null,
          deliveryAddress: null,
        };
        return;
      }
      
      // Set pharmacy ID if not already set
      if (!state.cart.pharmacyId) {
        state.cart.pharmacyId = pharmacyId;
      }
      
      // Check if item already exists in cart
      const existingItemIndex = state.cart.items.findIndex(
        cartItem => cartItem.medicineId === item.medicineId
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        state.cart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // Add new item
        state.cart.items.push(item);
      }
    },
    removeFromCart(state, action: PayloadAction<number>) {
      const medicineId = action.payload;
      state.cart.items = state.cart.items.filter(item => item.medicineId !== medicineId);
      
      // Reset pharmacy ID if cart is empty
      if (state.cart.items.length === 0) {
        state.cart.pharmacyId = null;
      }
    },
    updateCartItemQuantity(state, action: PayloadAction<{ medicineId: number; quantity: number }>) {
      const { medicineId, quantity } = action.payload;
      const itemIndex = state.cart.items.findIndex(item => item.medicineId === medicineId);
      
      if (itemIndex >= 0) {
        state.cart.items[itemIndex].quantity = quantity;
      }
    },
    setDeliveryType(state, action: PayloadAction<string>) {
      state.cart.deliveryType = action.payload;
    },
    setDeliveryAddress(state, action: PayloadAction<any>) {
      state.cart.deliveryAddress = action.payload;
    },
    clearCart(state) {
      state.cart = {
        items: [],
        pharmacyId: null,
        deliveryType: null,
        deliveryAddress: null,
      };
    },
    resetOrderError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create Order
    builder.addCase(createOrder.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload;
      state.activeOrders.push(action.payload);
      
      // Clear cart after successful order
      state.cart = {
        items: [],
        pharmacyId: null,
        deliveryType: null,
        deliveryAddress: null,
      };
    });
    builder.addCase(createOrder.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get My Orders
    builder.addCase(getMyOrders.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getMyOrders.fulfilled, (state, action) => {
      state.isLoading = false;
      state.orders = action.payload.items || action.payload;
    });
    builder.addCase(getMyOrders.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Active Orders
    builder.addCase(getActiveOrders.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getActiveOrders.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activeOrders = action.payload;
    });
    builder.addCase(getActiveOrders.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Order By ID
    builder.addCase(getOrderById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getOrderById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload;
      
      // Update order in orders and activeOrders arrays
      const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
      if (orderIndex >= 0) {
        state.orders[orderIndex] = action.payload;
      }
      
      const activeOrderIndex = state.activeOrders.findIndex(order => order.id === action.payload.id);
      if (activeOrderIndex >= 0) {
        state.activeOrders[activeOrderIndex] = action.payload;
      }
    });
    builder.addCase(getOrderById.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Update Order Status
    builder.addCase(updateOrderStatus.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload;
      
      // Update order in orders and activeOrders arrays
      const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
      if (orderIndex >= 0) {
        state.orders[orderIndex] = action.payload;
      }
      
      // Remove from active orders if delivered or cancelled
      if (action.payload.status === 'DELIVERED' || action.payload.status === 'CANCELLED') {
        state.activeOrders = state.activeOrders.filter(order => order.id !== action.payload.id);
      } else {
        const activeOrderIndex = state.activeOrders.findIndex(order => order.id === action.payload.id);
        if (activeOrderIndex >= 0) {
          state.activeOrders[activeOrderIndex] = action.payload;
        } else {
          state.activeOrders.push(action.payload);
        }
      }
    });
    builder.addCase(updateOrderStatus.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Update Order Tracking
    builder.addCase(updateOrderTracking.fulfilled, (state, action) => {
      // Update current order if it matches
      if (state.currentOrder && state.currentOrder.id === action.payload.id) {
        state.currentOrder = action.payload;
      }
      
      // Update in active orders
      const activeOrderIndex = state.activeOrders.findIndex(order => order.id === action.payload.id);
      if (activeOrderIndex >= 0) {
        state.activeOrders[activeOrderIndex] = action.payload;
      }
    });
    
    // Add Order Review
    builder.addCase(addOrderReview.fulfilled, (state, action) => {
      // Update current order
      if (state.currentOrder && state.currentOrder.id === action.payload.id) {
        state.currentOrder = action.payload;
      }
      
      // Update in orders array
      const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
      if (orderIndex >= 0) {
        state.orders[orderIndex] = action.payload;
      }
    });
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity,
  setDeliveryType,
  setDeliveryAddress,
  clearCart,
  resetOrderError,
} = orderSlice.actions;

export default orderSlice.reducer;
