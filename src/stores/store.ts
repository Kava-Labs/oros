import { configureStore } from '@reduxjs/toolkit';
import { msgStoreReducer } from './msgStore';

export const appStore = configureStore({
  reducer: {
    msgStore: msgStoreReducer,
  },
});
