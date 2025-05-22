import {
  ActiveProfileConfig,
  BrightnessConfig,
  ButtonBytes,
  DpiProfileConfig,
  LightingConfig,
  ReportRateState,
  SleepConfig,
} from "@/types";

const BUTTON_BINDINGS = {
  Off: [0x00],

  "Left Click": [0x81],
  "Right Click": [0x82],
  "Middle Click": [0x83],
  Back: [0x84],
  Forward: [0x85],

  // DPI
  "DPI Switch": [0x88],
  "DPI -": [0x89],
  "DPI +": [0x8a],

  // Media
  "Play/Pause": [0x8e, 0x01, 0xcd],
  Stop: [0x8e, 0x01, 0xb7],
  Prev: [0x8e, 0x01, 0xb6],
  Next: [0x8e, 0x01, 0xb5],
  "Vol Up": [0x8e, 0x01, 0xe9],
  "Vol Down": [0x8e, 0x01, 0xea],
  Mute: [0x8e, 0x01, 0xe2],
  "Media Player": [0x8e, 0x01, 0x83, 0x01],

  // Basic
  Cut: [0x8f, 0x01, 0x1b],
  Copy: [0x8f, 0x01, 0x06],
  Paste: [0x8f, 0x01, 0x19],
  All: [0x8f, 0x01, 0x04],
  Find: [0x8f, 0x01, 0x09],
  New: [0x8f, 0x01, 0x11],
  Print: [0x8f, 0x01, 0x13],
  Save: [0x8f, 0x01, 0x16],

  // Windows
  "Lock PC": [0x8f, 0x08, 0x0f],

  // Polling Rate
  "Rate +": [0x97],
  "Rate Switch": [0x97, 0x01],
  "Rate -": [0x98],

  // LED
  "LED Mode Switch": [0x9b, 0x08],
} as const;

export type ButtonBindingName = keyof typeof BUTTON_BINDINGS;
export type ButtonBindingValue = (typeof BUTTON_BINDINGS)[ButtonBindingName];

export const buttonBindingKeys = Object.keys(
  BUTTON_BINDINGS,
) as ButtonBindingName[];

const REVERSE_BUTTON_BINDINGS = new Map<string, ButtonBindingName>();

Object.entries(BUTTON_BINDINGS).forEach(([name, value]) => {
  const padded = [...value];
  while (padded.length < 4) padded.push(0x00);
  REVERSE_BUTTON_BINDINGS.set(
    JSON.stringify(padded),
    name as ButtonBindingName,
  );
});

// function getButtonBindingName(value: number[]): ButtonBindingName | undefined {
//   const padded = [...value];
//   while (padded.length < 4) padded.push(0x00);
//   return REVERSE_BUTTON_BINDINGS.get(JSON.stringify(padded));
// }

const EFFECT_BINDINGS = {
  Off: 0x01,
  Static: 0x02,
  Breathing: 0x03,
  "7 Color Breathing": 0x04,
  Neon: 0x05,
  Wave: 0x06,
  Responsive: 0x07,
  "Go Without Trace": 0x08,
  "Yo-Yo": 0x09,
  Marbles: 0x0a,
};

export type EffectBindingName = keyof typeof EFFECT_BINDINGS;
export type EffectBindingValue = (typeof EFFECT_BINDINGS)[EffectBindingName];

export const effectBindingKeys = Object.keys(
  EFFECT_BINDINGS,
) as EffectBindingName[];

const REVERSE_EFFECT_BINDING = new Map<number, EffectBindingName>();

Object.entries(EFFECT_BINDINGS).forEach(([name, value]) => {
  REVERSE_EFFECT_BINDING.set(value, name as EffectBindingName);
});

function getEffectBindingName(value: number): EffectBindingName | undefined {
  return REVERSE_EFFECT_BINDING.get(value);
}

// -----
// CLASS
// -----

export class KreoDevice {
  private static _instance: KreoDevice | null = null;

  static get instance(): KreoDevice | null {
    return this._instance;
  }

  static set instance(device: KreoDevice | null) {
    if (device && this._instance) {
      console.warn("Attempt to overwrite existing KreoDevice instance");
      return;
    }
    this._instance = device;
  }

  private _device: HIDDevice;
  private _inputListenerBound = false;

  constructor(device: HIDDevice) {
    if (KreoDevice._instance) {
      throw new Error("KreoDevice instance already exists!");
    }

    this._device = device;
    KreoDevice.instance = this;

    if (!this._inputListenerBound) {
      console.log("Registering inputreport handler");
      this._device.addEventListener("inputreport", this.handleInputReport);
      this._inputListenerBound = true;
      this.loadConfig();
    }
  }

  private debug = true;

  private _modifiedKeys = new Set<string>();

  private responseQueue: DataView[] = [];
  private responseResolvers: ((value: DataView) => void)[] = [];

  protected config = {
    dpi: {
      activeProfile: 0,
      profiles: [
        { dpi: 0x0007, enabled: 0x01 },
        { dpi: 0x000f, enabled: 0x01 },
        { dpi: 0x001f, enabled: 0x01 },
        { dpi: 0x002f, enabled: 0x01 },
        { dpi: 0x003f, enabled: 0x01 },
        { dpi: 0x007f, enabled: 0x01 },
      ],
    },
    lighting: {
      red: 0xff,
      green: 0x00,
      blue: 0x00,
      effect: 0x02,
      brightness: 0x03,
      speed: 0x05,
      moveLightOff: 0x00,
    },
    performance: {
      reportRate: 0x01,
      sleep: 0x01,
    },
    buttonsMapping: {
      left: [0x81, 0x00, 0x00, 0x00],
      right: [0x82, 0x00, 0x00, 0x00],
      middle: [0x83, 0x00, 0x00, 0x00],
      forward: [0x85, 0x00, 0x00, 0x00],
      back: [0x84, 0x00, 0x00, 0x00],
      dpi: [0x88, 0x00, 0x00, 0x00],
    },
  };

  // ---------------------------------
  // Nested classes for setter getters
  // ---------------------------------
  public get device() {
    return this._device;
  }

  private handleInputReport = (event: HIDInputReportEvent) => {
    const { data } = event;

    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    if (this.responseResolvers.length > 0) {
      const resolver = this.responseResolvers.shift();
      resolver?.(data);
    } else {
      this.responseQueue.push(data);
    }

    if (this.debug) {
      const hexBytes = Array.from(bytes).map((b) =>
        b.toString(16).padStart(2, "0"),
      );
      console.log(
        `Input report (hex) at ${new Date().toLocaleTimeString()}:`,
        hexBytes.join(" "),
      );
    }
  };

  static async connect(): Promise<KreoDevice> {
    if (KreoDevice._instance) {
      return KreoDevice._instance;
    }

    const devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: 0x248a }].map(({ vendorId }) => ({
        vendorId,
        usagePage: 0x01,
        usage: 0x02,
      })),
    });

    if (devices.length === 0) {
      throw new Error("No device selected");
    }

    const device = devices[0];

    if (device.opened) {
      await device.close();
    }

    await new Promise((r) => setTimeout(r, 200));
    await device.open();

    console.log("Device connected: ", device);
    return new KreoDevice(device);
  }

  public async close() {
    this._device.removeEventListener("inputreport", this.handleInputReport);
    await this._device.close();
    KreoDevice._instance = null;
  }

  public saveConfig() {
    const configJson = JSON.stringify(this.config);
    localStorage.setItem("kreoDeviceConfig", configJson);
  }

  public loadConfig() {
    const configJson = localStorage.getItem("kreoDeviceConfig");
    if (configJson) {
      this.config = JSON.parse(configJson);
    } else {
      console.warn("No saved config found. Using default config");
    }
  }

  public get configuration() {
    return {
      dpi: {
        activeProfile: this.dpiProxy.activeProfile,
        profiles: this.dpiProxy.profiles,
      },
      lighting: {
        color: this.lightingProxy.color,
        effect: this.lightingProxy.effect,
        brightness: this.lightingProxy.brightness,
        speed: this.lightingProxy.speed,
        moveLightOff: this.lightingProxy.moveLightOff,
      },
      performance: {
        reportRate: this.performanceProxy.reportRate,
        sleep: this.performanceProxy.sleep,
      },
    };
  }

  // ---------------------------------
  // Nested classes for setter getters
  // ---------------------------------
  static DpiProxy = class {
    constructor(private device: KreoDevice) {}

    set activeProfile(value: ActiveProfileConfig) {
      this.device.config.dpi.activeProfile = this.device.clamp(value, 0, 5);
      this.device._modifiedKeys.add("activeProfile");
    }

    get activeProfile(): number {
      return this.device.config.dpi.activeProfile;
    }

    get profiles(): DpiProfileConfig[] {
      const device = this.device;

      return this.device.config.dpi.profiles.map((profile) => ({
        get dpi(): number {
          return (profile.dpi + 1) * 50;
        },

        set dpi(value: number) {
          profile.dpi = Math.floor(device.clamp(value, 50, 26000) / 50 - 1);
          device._modifiedKeys.add(`dpiProfiles`);
        },

        get enabled(): boolean {
          return profile.enabled === 1;
        },

        set enabled(value: boolean) {
          profile.enabled = value ? 1 : 0;
          device._modifiedKeys.add(`dpiProfiles`);
        },
      }));
    }
  };

  private dpiProxy = new KreoDevice.DpiProxy(this);
  get dpi() {
    return this.dpiProxy;
  }

  static LightingProxy = class {
    constructor(private device: KreoDevice) {}

    private setLightingComponent<K extends keyof LightingConfig>(
      key: K,
      value: number,
      min: number,

      max: number,
    ): void {
      (this.device.config.lighting[key] as LightingConfig[K]) =
        this.device.clamp(value, min, max) as LightingConfig[K];
      this.device._modifiedKeys.add(`${String(key)}`);
    }

    set red(value: number) {
      this.setLightingComponent("red", value, 0x00, 0xff);
    }
    get red(): number {
      return this.device.config.lighting.red;
    }

    set green(value: number) {
      this.setLightingComponent("green", value, 0x00, 0xff);
    }
    get green(): number {
      return this.device.config.lighting.green;
    }

    set blue(value: number) {
      this.setLightingComponent("blue", value, 0x00, 0xff);
    }
    get blue(): number {
      return this.device.config.lighting.blue;
    }

    set color(value: string) {
      const match = value.match(
        /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*([01](?:\.\d+)?))?\)$/,
      );
      if (!match) throw new Error(`Invalid color format: ${value}`);

      const [, r, g, b] = match.map(Number);
      this.red = r;
      this.green = g;
      this.blue = b;
      this.device._modifiedKeys.add("color");
    }
    get color(): string {
      return `rgba(${this.red}, ${this.green}, ${this.blue}, 1)`;
    }

    set effect(value: EffectBindingName) {
      this.setLightingComponent("effect", EFFECT_BINDINGS[value], 0x01, 0x0a);
    }
    get effect() {
      return getEffectBindingName(
        this.device.config.lighting.effect,
      ) as EffectBindingName;
    }

    set brightness(value: BrightnessConfig) {
      this.setLightingComponent("brightness", value, 0x00, 0x03);
    }
    get brightness(): BrightnessConfig {
      return this.device.config.lighting.brightness as BrightnessConfig;
    }

    set speed(value: number) {
      this.setLightingComponent("speed", value, 0x01, 0x05);
    }
    get speed(): number {
      return this.device.config.lighting.speed;
    }

    set moveLightOff(value: boolean) {
      this.device.config.lighting.moveLightOff = value ? 0x00 : 0xff;
      this.device._modifiedKeys.add("moveLightOff");
    }
    get moveLightOff(): boolean {
      return this.device.config.lighting.moveLightOff === 0x00;
    }
  };

  private lightingProxy = new KreoDevice.LightingProxy(this);
  get lighting() {
    return this.lightingProxy;
  }

  static PerformanceProxy = class {
    constructor(private device: KreoDevice) {}

    private rateMap = {
      125: 0x08,
      250: 0x04,
      500: 0x02,
      1000: 0x01,
    };

    set reportRate(value: ReportRateState) {
      if (!(value in this.rateMap)) {
        throw new Error("Invalid report rate");
      }
      this.device.config.performance.reportRate = this.rateMap[value];
      this.device._modifiedKeys.add("reportRate");
    }
    get reportRate(): ReportRateState {
      const reverseMap = Object.entries(this.rateMap).find(
        ([, v]) => v === this.device.config.performance.reportRate,
      );
      return Number(reverseMap?.[0]) as ReportRateState;
    }

    set sleep(value: SleepConfig) {
      this.device.config.performance.sleep = this.device.clamp(
        value,
        0x01,
        0x09,
      ) as SleepConfig;
      this.device._modifiedKeys.add("sleep");
    }
    get sleep() {
      return this.device.config.performance.sleep as SleepConfig;
    }
  };

  private performanceProxy = new KreoDevice.PerformanceProxy(this);
  get performance() {
    return this.performanceProxy;
  }

  static ButtonMappingProxy = class {
    constructor(private device: KreoDevice) {}

    private padBytes(input: readonly number[]): number[] {
      return [...input, 0x00, 0x00, 0x00, 0x00].slice(0, 4);
    }

    private setButton(
      field: keyof typeof this.device.config.buttonsMapping,
      value: ButtonBindingName,
    ): void {
      const byteValue = BUTTON_BINDINGS[value];
      if (!byteValue) {
        throw new Error(`Unknown button binding: "${value}"`);
      }

      const paddedValue = this.padBytes(byteValue);

      const isSettingLeftClick =
        JSON.stringify(paddedValue) ===
        JSON.stringify(this.padBytes(BUTTON_BINDINGS["Left Click"]));

      const simulated = {
        ...this.device.config.buttonsMapping,
        [field]: paddedValue,
      };

      const hasLeftClickElsewhere = Object.entries(simulated).some(
        ([key, val]) => {
          if (key === field && !isSettingLeftClick) return false;
          return (
            JSON.stringify(val) ===
            JSON.stringify(this.padBytes(BUTTON_BINDINGS["Left Click"]))
          );
        },
      );

      if (!hasLeftClickElsewhere && !isSettingLeftClick) {
        throw new Error(`At least one button must remain mapped to Left Click`);
      }

      this.device.config.buttonsMapping[field] = paddedValue as ButtonBytes;
      this.device._modifiedKeys.add(field);
    }

    private getButton(
      field: keyof typeof this.device.config.buttonsMapping,
    ): ButtonBindingName {
      const current = this.device.config.buttonsMapping[field];
      const paddedCurrent = [...current, 0x00, 0x00, 0x00, 0x00].slice(0, 4);

      const entry = Object.entries(BUTTON_BINDINGS).find(([, value]) => {
        const paddedValue = [...value, 0x00, 0x00, 0x00, 0x00].slice(0, 4);
        return paddedCurrent.every((v, i) => v === paddedValue[i]);
      });

      if (!entry) {
        throw new Error(`Unknown binding for field: "${field}"`);
      }

      return entry[0] as ButtonBindingName;
    }

    getBinding(
      key: keyof typeof this.device.config.buttonsMapping,
    ): ButtonBindingName {
      return this.getButton(key);
    }

    setBinding(
      key: keyof typeof this.device.config.buttonsMapping,
      value: ButtonBindingName,
    ): void {
      this.setButton(key, value);
    }

    // getButtonBindingName(value: number[]): ButtonBindingName | undefined {
    //   return getButtonBindingName(value);
    // }

    // getAvailableBindings(): Record<ButtonBindingName, ButtonBindingValue> {
    //   return BUTTON_BINDINGS;
    // }

    set left(value: ButtonBindingName) {
      this.setButton("left", value);
    }
    get left(): ButtonBindingName {
      return this.getButton("left");
    }

    set right(value: ButtonBindingName) {
      this.setButton("right", value);
    }
    get right(): ButtonBindingName {
      return this.getButton("right");
    }

    set middle(value: ButtonBindingName) {
      this.setButton("middle", value);
    }
    get middle(): ButtonBindingName {
      return this.getButton("middle");
    }

    set forward(value: ButtonBindingName) {
      this.setButton("forward", value);
    }
    get forward(): ButtonBindingName {
      return this.getButton("forward");
    }

    set back(value: ButtonBindingName) {
      this.setButton("back", value);
    }
    get back(): ButtonBindingName {
      return this.getButton("back");
    }

    set dpi(value: ButtonBindingName) {
      this.setButton("dpi", value);
    }
    get dpi(): ButtonBindingName {
      return this.getButton("dpi");
    }
  };

  private buttonMappingProxy = new KreoDevice.ButtonMappingProxy(this);
  get buttonMapping() {
    return this.buttonMappingProxy;
  }

  // -------
  // Helpers
  // -------
  protected clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  private wasModified(...keys: string[]) {
    return keys.some((key) => this._modifiedKeys.has(key));
  }

  // -------------
  // DATA-TRANSFER
  // -------------

  private waitForResponse(timeout = 5000): Promise<DataView> {
    return new Promise((resolve, reject) => {
      if (this.responseQueue.length > 0) {
        return resolve(this.responseQueue.shift()!);
      }

      const timer = setTimeout(() => {
        const index = this.responseResolvers.indexOf(resolve);
        if (index !== -1) this.responseResolvers.splice(index, 1);
        reject(new Error("Timeout waiting for response"));
      }, timeout);

      this.responseResolvers.push((data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  private async sendData(packets: number[][]) {
    for (const packet of packets) {
      const data = new Uint8Array(32);
      data.set(packet);
      await this._device.sendReport(5, data);

      try {
        await this.waitForResponse();
      } catch (err) {
        console.warn("Timeout or error while waiting for response", err);
      }
    }
  }

  public async sendHeader(numHeaders: number = 1) {
    const packets: number[][] = [[0x26, 0xfa, 0x46]];

    console.log("sending header");

    for (let i = 0; i < numHeaders; i++) await this.sendData(packets);
  }

  public async sendFooter() {
    const packets: number[][] = [
      [0x57, 0xfa, 0x40, 0xf3, 0x04],
      [0x48, 0xfa, 0x40, 0xf3, 0x01],
      [0x49, 0xfa, 0x40, 0xf3, 0x02],
      [0x53, 0xfa, 0x40, 0xf3, 0x08],
      [0x5b, 0xfa, 0x40, 0xf3, 0x10],
      [0x27, 0xfa, 0x46, 0x01],
      [0x24, 0xfa, 0x48],
    ];

    console.log("sending footer");

    await this.sendData(packets);
  }

  // -------
  // Packets
  // -------

  private get packetsA(): number[][] {
    return [
      [
        0xb9,
        0xfa,
        0x01,
        0x00,
        0x00,
        0x13,
        0xd1,
        0x02,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        this.config.lighting.moveLightOff,
        this.config.performance.sleep,
        0x01,
        0x01,
        this.config.performance.reportRate,
        0x00,
        0x00,
        0x00,
        0x00,
        0x1f,
        this.config.dpi.activeProfile,
        this.config.lighting.effect,
      ],
      [0x28, 0xfa, 0x01, 0x7f, 0x00, 0x01, 0xd3, 0x1a],
    ];
  }

  private get packetsB(): number[][] {
    return [
      [0xb6, 0xfa, 0x03, 0x00, 0x00, 0x02, 0xd1, 0x0a],
      [
        0x8f,
        0xfa,
        0x03,
        0x02,
        0x00,
        0x18,
        0xd2,
        ...this.config.buttonsMapping.left,
        ...this.config.buttonsMapping.right,
        ...this.config.buttonsMapping.middle,
        ...this.config.buttonsMapping.back,
        ...this.config.buttonsMapping.forward,
        ...this.config.buttonsMapping.dpi,
      ],
      [0x67, 0xfa, 0x03, 0x1a, 0x00, 0x18, 0xd2],
      [0x7f, 0xfa, 0x03, 0x32, 0x00, 0x18, 0xd2],
      [
        0x57, 0xfa, 0x03, 0x4a, 0x00, 0x18, 0xd2, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x8b,
        0x00, 0x00, 0x00, 0x8c,
      ],
      [0x53, 0xfa, 0x03, 0x62, 0x00, 0x04, 0xd2, 0xff, 0xff, 0xff, 0xff],
      [0x36, 0xfa, 0x03, 0x7f, 0x00, 0x01, 0xd3, 0x1a],
    ];
  }

  private get packetsC(): number[][] {
    const packets: number[][] = [];

    // Header
    packets.push([0xa8, 0xfa, 0x02, 0x00, 0x00, 0x01, 0xd1, 0x06]);

    const dpiBytes = [0xb2, 0xbf, 0xb8, 0x85, 0x8e, 0x8b];

    this.config.dpi.profiles.slice(0, 6).forEach((profile, index) => {
      const packet = [
        dpiBytes[index],
        0xfa,
        0x02,
        0x01 + index * 5,
        0x00,
        0x05,
        0xd2,
        profile.enabled,
        profile.dpi & 0xff,
        (profile.dpi >> 8) & 0xff,
        profile.dpi & 0xff,
        (profile.dpi >> 8) & 0xff,
      ];
      packets.push(packet);
    });

    // Footer?
    packets.push(
      [0x94, 0xfa, 0x02, 0x1f, 0x00, 0x05, 0xd2],
      [0x91, 0xfa, 0x02, 0x24, 0x00, 0x05, 0xd2],
      [0x29, 0xfa, 0x02, 0x7f, 0x00, 0x01, 0xd3, 0x1a],
    );

    return packets;
  }

  private get packetsD(): number[][] {
    return [
      [
        0x81,
        0xfa,
        0x04,
        0x00,
        0x00,
        0x18,
        0xd1,
        0x80,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x80,
        this.config.lighting.red,
        this.config.lighting.green,
        this.config.lighting.blue,
        0x01,
        0x00,
        0x02,
        this.config.lighting.brightness,
        0x80,
        0x00,
        0xff,
        0xff,
        0x01,
        0x05,
        0x04,
        0x03,
      ],
      [
        0x66, 0xfa, 0x04, 0x18, 0x00, 0x18, 0xd2, 0x80, 0x00, 0x00, 0x00, 0x01,
        0x05, 0x01, 0x03, 0x80, 0x00, 0x00, 0x00, 0x01, 0x05, 0x08, 0x03, 0x80,
        0x00, 0x00, 0x00, 0x05, 0x05, 0x01, 0x03,
      ],
      [
        0x7e, 0xfa, 0x04, 0x30, 0x00, 0x18, 0xd2, 0x80, 0x00, 0x00, 0x00, 0x07,
        0x00, 0x00, 0x03, 0x80, 0x00, 0x00, 0x00, 0x06, 0x05, 0x00, 0x03, 0x80,
        0x00, 0x00, 0x00, 0x08, 0x05, 0x00, 0x03,
      ],
      [
        0x46,
        0xfa,
        0x04,
        0x48,
        0x00,
        0x08,
        0xd2,
        0x80,
        0x00,
        0x00,
        0x00,
        0x09,
        this.config.lighting.speed,
        0x00,
        0x03,
      ],
      [0x37, 0xfa, 0x04, 0x7f, 0x00, 0x01, 0xd3, 0x1a],
    ];
  }

  // ------
  // Update
  // ------

  async sendUpdates() {
    const packetsToSend: number[][] = [];

    console.log(this._modifiedKeys);

    if (
      this.wasModified(
        "moveLightOff",
        "sleep",
        "reportRate",
        "activeProfile",
        "effect",
      )
    ) {
      const packet = this.packetsA;
      console.log("Updating packet A");
      packetsToSend.push(...packet);
    }

    if (this.wasModified("left", "right", "middle", "forward", "back", "dpi")) {
      console.log("Updating packet B");
      packetsToSend.push(...this.packetsB);
    }

    if (this.wasModified("dpiProfiles")) {
      console.log("Updating packet C");
      packetsToSend.push(...this.packetsC);
    }

    if (
      this.wasModified("red", "green", "blue", "brightness", "speed", "color")
    ) {
      console.log("Updating packet D");
      packetsToSend.push(...this.packetsD);
    }

    if (packetsToSend.length > 0) {
      console.log(packetsToSend);
      await this.sendHeader(3);
      await this.sendData(packetsToSend);
      await this.sendFooter();
      this._modifiedKeys.clear();
      this.saveConfig();
    }
  }

  public async getBatteryLevel(): Promise<number> {
    const requestPacket = new Uint8Array(32);
    requestPacket.set([0x24, 0xfa, 0x48]);
    await this._device.sendReport(0x05, requestPacket);

    const response = await this.waitForResponse();
    const bytes = new Uint8Array(
      response.buffer,
      response.byteOffset,
      response.byteLength,
    );

    if (bytes[1] !== 0xfa || bytes[2] !== 0x48) {
      throw new Error("Unexpected response to battery query");
    }

    const batteryLevelRaw = bytes[3];
    const batteryLevel = Math.round((batteryLevelRaw * 100) / 255);

    return batteryLevel;
  }
}
