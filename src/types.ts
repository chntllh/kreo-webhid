import { IconType } from "react-icons";
import { KreoDevice } from "./api/HIDDevice";

export interface DeviceConfig {
  dpi: DpiConfig;
  lighting: LightingConfig;
  performance: PerformanceConfig;
  buttonMapping: ButtonMappingConfig[];
}

export interface DpiConfig {
  activeProfile: ActiveProfileConfig;
  profiles: DpiProfileConfig[];
}

export type ActiveProfileConfig = 0 | 1 | 2 | 3 | 4 | 5;

export interface DpiProfileConfig {
  dpi: number;
  enabled: boolean;
}

export interface LightingConfig {
  red: number;
  green: number;
  blue: number;
  effect: EffectConfig;
  brightness: BrightnessConfig;
  speed: SpeedConfig;
  moveLightOff: 0x00 | 0x01;
}

export interface LightingState {
  color: string;
  effect: number;
  brightness: number;
  speed: number;
  moveToLightOff: boolean;
}

export type EffectConfig =
  | 0x01
  | 0x02
  | 0x03
  | 0x04
  | 0x05
  | 0x06
  | 0x07
  | 0x08
  | 0x09
  | 0x0a;

export type BrightnessConfig = 0 | 1 | 2 | 3;

export type SpeedConfig = 1 | 2 | 3 | 4 | 5;

export interface PerformanceConfig {
  reportRate: ReportRateConfig;
  sleepTimer: SleepConfig;
}

export type ReportRateConfig = 1 | 2 | 4 | 8;

export type ReportRateState = 125 | 250 | 500 | 1000;

export type SleepConfig =
  | 0x01
  | 0x02
  | 0x03
  | 0x04
  | 0x05
  | 0x06
  | 0x07
  | 0x08
  | 0x09;

export interface ButtonMappingConfig {
  [buttonIndex: number]: string;
}

export type ButtonBytes = [number, number, number, number];

export type ButtonName = keyof KreoDevice["buttonMapping"];

export type ButtonMappingKey = keyof KreoDevice["config"]["buttonsMapping"];

export interface Panel {
  id: string;
  label: string;
  icon: IconType;
}

export interface SidebarProps {
  activePanel: string;
  onSelectPanel: (panel: string) => void;
  panels: Panel[];
  battery: number;
  device: KreoDevice;
}

export type SvgPath = {
  d: string;
  key: string;
  interactive: boolean;
};

export type MouseSvgProps = {
  selectedKey: ButtonName | undefined;
  onSelect: (key: ButtonName) => void;
  paths: SvgPath[];
};

export interface BatterySvgProps {
  level: number;
  scale?: number;
}
