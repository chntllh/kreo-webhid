import { configureStore } from "@reduxjs/toolkit";
import devicesReducer from "./slices/devicesSlice";
import { loadState, saveState } from "./localStorage";

const preloadedState = loadState();

const store = configureStore({
  reducer: {
    devices: devicesReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  saveState({
    devices: store.getState().devices,
  });
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
