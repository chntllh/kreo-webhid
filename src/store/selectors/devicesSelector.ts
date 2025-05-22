import { RootState } from "..";

export const selectCurrentDeviceId = (state: RootState): string | null =>
  state.devices.currentDeviceId;
