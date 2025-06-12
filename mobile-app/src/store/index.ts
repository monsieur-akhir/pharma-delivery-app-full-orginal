
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authSlice from './slices/authSlice';
import chatSlice from './slices/chatSlice';
import locationSlice from './slices/locationSlice';
import medicineSlice from './slices/medicineSlice';
import orderSlice from './slices/orderSlice';
import prescriptionSlice from './slices/prescriptionSlice';
import reminderSlice from './slices/reminderSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'reminder'], // Only persist auth and reminder data
};

const rootReducer = combineReducers({
  auth: authSlice,
  chat: chatSlice,
  location: locationSlice,
  medicine: medicineSlice,
  order: orderSlice,
  prescription: prescriptionSlice,
  reminder: reminderSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
