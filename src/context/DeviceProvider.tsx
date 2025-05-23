import { KreoDevice } from "@/api/HIDDevice";
import { createContext, useEffect, useState } from "react";

type DeviceContextType = {
  device: KreoDevice | null;
  setDevice: (device: KreoDevice | null) => void;
  requestDevice: () => void;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: React.ReactNode }) => {
  const [device, setDeviceState] = useState<KreoDevice | null>(
    KreoDevice.instance,
  );

  const setDevice = (device: KreoDevice | null) => {
    setDeviceState(device);
    KreoDevice.instance = device;
  };

  useEffect(() => {
    const reconnect = async () => {
      try {
        const devices = await navigator.hid.getDevices();

        if (devices.length > 0) {
          const hidDevice = devices[0];

          if (!hidDevice.opened) {
            try {
              await hidDevice.open();
            } catch (error) {
              if (
                error instanceof Error &&
                error.name !== "InvalidStateError"
              ) {
                throw error;
              }
            }
          }

          if (!KreoDevice.instance) {
            const kreo = new KreoDevice(hidDevice);
            setDevice(kreo);
          } else {
            if (import.meta.env.MODE === "development") {
              console.log("Reusing existing KreoDevice instance");
            }
            setDevice(KreoDevice.instance);
          }
        }
      } catch (err) {
        throw Error(`Auto-reconnect failed: ${err}`);
      }
    };

    reconnect();
  }, []);

  const requestDevice = async () => {
    if (KreoDevice.instance) {
      setDevice(KreoDevice.instance);
      return;
    }

    try {
      const kreo = await KreoDevice.connect();
      setDevice(kreo);
    } catch (err) {
      console.error(`User-initiated connection failed: ${err}`);
    }
  };

  return (
    <DeviceContext.Provider value={{ device, setDevice, requestDevice }}>
      {children}
    </DeviceContext.Provider>
  );
};

export { DeviceContext };
