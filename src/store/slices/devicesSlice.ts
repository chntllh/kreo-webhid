import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { resetStore } from "../resetAction";

interface DevicesState {
  currentDeviceId: string | null;
  devicesIds: string[];
}

const initialState: DevicesState = {
  currentDeviceId: null,
  devicesIds: [],
};

const devicesSlice = createSlice({
  name: "devices",
  initialState,
  reducers: {
    registerDevice(state, action: PayloadAction<string>) {
      // state.devices[action.payload.id] = action.payload.config;
      if (!state.devicesIds.includes(action.payload)) {
        state.devicesIds.push(action.payload);
      }
    },
    unregisterDevice(state, action: PayloadAction<string>) {
      // delete state.devices[action.payload];
      state.devicesIds = state.devicesIds.filter((id) => id !== action.payload);
    },
    setCurrentDevice(state, action: PayloadAction<string>) {
      state.currentDeviceId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetStore, () => initialState);
  },
});

export const { unregisterDevice, setCurrentDevice } = devicesSlice.actions;

export default devicesSlice.reducer;
