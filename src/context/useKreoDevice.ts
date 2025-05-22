import { useContext } from "react";
import { DeviceContext } from "@/context/DeviceProvider";

export const useKreoDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useKreoDevice must be used within a DeviceProvider");
  }
  return context;
};
