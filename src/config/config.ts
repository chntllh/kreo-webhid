import { ButtonMappingConfig } from "@/types";

type DeviceConfig = {
  dpi: {
    activeProfile: number;
    profiles: { dpi: number; enabled: boolean }[];
  };
  lighting: {
    color: string;
    effect: number;
    brightness: number;
    speed: number;
    moveToLightOff: boolean;
  };
  performance: {
    reportRate: number;
    sleepTimer: number;
  };
  buttonMapping: ButtonMappingConfig[];
};

export const deviceConfigs: { [key: string]: DeviceConfig } = {
  "9354-64002": {
    dpi: {
      activeProfile: 1,
      profiles: [
        { dpi: 400, enabled: true },
        { dpi: 800, enabled: true },
        { dpi: 1600, enabled: true },
        { dpi: 3200, enabled: true },
        { dpi: 4800, enabled: true },
        { dpi: 6400, enabled: true },
      ],
    },
    lighting: {
      color: "rgba(255, 0, 0, 1)",
      effect: 2,
      brightness: 3,
      speed: 5,
      moveToLightOff: true,
    },
    performance: {
      reportRate: 1000,
      sleepTimer: 3,
    },
    buttonMapping: [],
  },
};
