import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';

interface ReminderState {
  reminders: any[];
  currentReminder: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReminderState = {
  reminders: [],
  currentReminder: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const getMyReminders = createAsyncThunk(
  'reminder/getMyReminders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reminders/my-reminders');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reminders');
    }
  }
);

export const createReminder = createAsyncThunk(
  'reminder/create',
  async (reminderData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/reminders', reminderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create reminder');
    }
  }
);

export const updateReminder = createAsyncThunk(
  'reminder/update',
  async ({ id, reminderData }: { id: number; reminderData: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/reminders/${id}`, reminderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update reminder');
    }
  }
);

export const deleteReminder = createAsyncThunk(
  'reminder/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/reminders/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete reminder');
    }
  }
);

export const markReminderAsCompleted = createAsyncThunk(
  'reminder/markAsCompleted',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/reminders/${id}/complete`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark reminder as completed');
    }
  }
);

export const snoozeReminder = createAsyncThunk(
  'reminder/snooze',
  async ({ id, duration }: { id: number; duration?: number }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/reminders/${id}/snooze`, { duration });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to snooze reminder');
    }
  }
);

// Slice
const reminderSlice = createSlice({
  name: 'reminder',
  initialState,
  reducers: {
    setCurrentReminder(state, action: PayloadAction<any>) {
      state.currentReminder = action.payload;
    },
    resetReminderError(state) {
      state.error = null;
    },
    resetCurrentReminder(state) {
      state.currentReminder = null;
    },
  },
  extraReducers: (builder) => {
    // Get My Reminders
    builder.addCase(getMyReminders.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getMyReminders.fulfilled, (state, action) => {
      state.isLoading = false;
      state.reminders = action.payload;
    });
    builder.addCase(getMyReminders.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Create Reminder
    builder.addCase(createReminder.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createReminder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.reminders.push(action.payload);
      state.currentReminder = action.payload;
    });
    builder.addCase(createReminder.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Update Reminder
    builder.addCase(updateReminder.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateReminder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentReminder = action.payload;
      
      // Update in reminders array
      const index = state.reminders.findIndex(reminder => reminder.id === action.payload.id);
      if (index !== -1) {
        state.reminders[index] = action.payload;
      }
    });
    builder.addCase(updateReminder.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Delete Reminder
    builder.addCase(deleteReminder.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteReminder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.reminders = state.reminders.filter(reminder => reminder.id !== action.payload);
      
      if (state.currentReminder && state.currentReminder.id === action.payload) {
        state.currentReminder = null;
      }
    });
    builder.addCase(deleteReminder.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Mark Reminder as Completed
    builder.addCase(markReminderAsCompleted.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(markReminderAsCompleted.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentReminder = action.payload;
      
      // Update in reminders array
      const index = state.reminders.findIndex(reminder => reminder.id === action.payload.id);
      if (index !== -1) {
        state.reminders[index] = action.payload;
      }
    });
    builder.addCase(markReminderAsCompleted.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Snooze Reminder
    builder.addCase(snoozeReminder.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(snoozeReminder.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentReminder = action.payload;
      
      // Update in reminders array
      const index = state.reminders.findIndex(reminder => reminder.id === action.payload.id);
      if (index !== -1) {
        state.reminders[index] = action.payload;
      }
    });
    builder.addCase(snoozeReminder.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export const { 
  setCurrentReminder, 
  resetReminderError, 
  resetCurrentReminder 
} = reminderSlice.actions;

export default reminderSlice.reducer;
