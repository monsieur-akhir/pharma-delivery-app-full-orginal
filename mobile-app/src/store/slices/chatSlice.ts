import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';

interface ChatState {
  conversations: any[];
  activeConversation: {
    userId?: number;
    orderId?: number;
    messages: any[];
  };
  unreadCount: number;
  socketConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  activeConversation: {
    userId: undefined,
    orderId: undefined,
    messages: [],
  },
  unreadCount: 0,
  socketConnected: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const getConversation = createAsyncThunk(
  'chat/getConversation',
  async ({ userId, orderId }: { userId?: number; orderId?: number }, { rejectWithValue }) => {
    try {
      let response;
      
      if (orderId) {
        // Get conversation for order
        response = await api.get(`/chat/order/${orderId}`);
      } else if (userId) {
        // Get conversation with user
        response = await api.get(`/chat/user/${userId}`);
      } else {
        throw new Error('Either userId or orderId must be provided');
      }
      
      return {
        userId,
        orderId,
        messages: response.data,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversation');
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  'chat/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat/unread');
      return response.data.count;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread messages count');
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (messageId: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/chat/messages/${messageId}/read`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark message as read');
    }
  }
);

// Slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSocketConnected(state, action: PayloadAction<boolean>) {
      state.socketConnected = action.payload;
    },
    addMessage(state, action: PayloadAction<any>) {
      const message = action.payload;
      
      // Add to active conversation if it matches
      if (
        (state.activeConversation.userId === message.senderId || 
         state.activeConversation.userId === message.receiverId) ||
        state.activeConversation.orderId === message.orderId
      ) {
        state.activeConversation.messages.push(message);
      }
      
      // Increment unread count if recipient and not read
      if (!message.isRead && message.receiverId === message.currentUserId) {
        state.unreadCount++;
      }
    },
    updateMessageReadStatus(state, action: PayloadAction<{ messageId: number; readAt: Date }>) {
      const { messageId, readAt } = action.payload;
      
      // Update in active conversation
      const messageIndex = state.activeConversation.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        state.activeConversation.messages[messageIndex].isRead = true;
        state.activeConversation.messages[messageIndex].readAt = readAt;
      }
      
      // Decrement unread count if necessary
      if (state.unreadCount > 0) {
        state.unreadCount--;
      }
    },
    clearActiveConversation(state) {
      state.activeConversation = {
        userId: undefined,
        orderId: undefined,
        messages: [],
      };
    },
    resetChatError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get Conversation
    builder.addCase(getConversation.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getConversation.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activeConversation = action.payload;
    });
    builder.addCase(getConversation.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Get Unread Count
    builder.addCase(getUnreadCount.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getUnreadCount.fulfilled, (state, action) => {
      state.isLoading = false;
      state.unreadCount = action.payload;
    });
    builder.addCase(getUnreadCount.rejected, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    
    // Mark Message as Read
    builder.addCase(markMessageAsRead.fulfilled, (state, action) => {
      const message = action.payload;
      
      // Update in active conversation
      const messageIndex = state.activeConversation.messages.findIndex(m => m.id === message.id);
      if (messageIndex !== -1) {
        state.activeConversation.messages[messageIndex].isRead = true;
        state.activeConversation.messages[messageIndex].readAt = message.readAt;
      }
      
      // Decrement unread count if necessary
      if (state.unreadCount > 0) {
        state.unreadCount--;
      }
    });
  },
});

export const { 
  setSocketConnected, 
  addMessage, 
  updateMessageReadStatus,
  clearActiveConversation,
  resetChatError,
} = chatSlice.actions;

export default chatSlice.reducer;
