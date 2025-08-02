import { configureStore } from '@reduxjs/toolkit';
import qsoReducer from './qsoSlice';
import settingsReducer from './settingSlice';
import contestReducer from './contestSlice';
import clusterReducer from './clusterSlice';

export const store = configureStore({
  reducer: {
    qsos: qsoReducer,
    settings: settingsReducer,
    contest: contestReducer,
    cluster: clusterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
