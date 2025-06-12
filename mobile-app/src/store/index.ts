
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

import authSlice from './slices/authSlice';
import medicineSlice from './slices/medicineSlice';
import orderSlice from './slices/orderSlice';
import reminderSlice from './slices/reminderSlice';
import prescriptionSlice from './slices/prescriptionSlice';
import locationSlice from './slices/locationSlice';
import chatSlice from './slices/chatSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'medicine', 'order', 'reminder'],
};

const rootReducer = combineReducers({
  auth: authSlice,
  medicine: medicineSlice,
  order: orderSlice,
  reminder: reminderSlice,
  prescription: prescriptionSlice,
  location: locationSlice,
  chat: chatSlice,
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
