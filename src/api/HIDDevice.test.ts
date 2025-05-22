import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MockHIDDevice } from "./HIDDeviceMock";
import { EffectBindingName, KreoDevice } from "./HIDDevice";
import { BrightnessConfig } from "@/types";

type ReportRate = 125 | 250 | 500 | 1000;
type DpiProfileIndex = 0 | 1 | 2 | 3 | 4 | 5;
type SleepValue = 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09;

let device: MockHIDDevice;
let kreo: KreoDevice;

function paddedPacket(start: number[]) {
  const packet = new Array(32).fill(0);
  start.forEach((v, i) => (packet[i] = v));
  return packet;
}

beforeEach(() => {
  device = new MockHIDDevice();
  kreo = new KreoDevice(device as unknown as HIDDevice);
});

afterEach(() => {
  KreoDevice.instance = null;
});

describe("dpi", () => {
  it.each([
    { input: -10, expected: 0 },
    { input: -1, expected: 0 },
    { input: 0, expected: 0 },
    { input: 1, expected: 1 },
    { input: 4, expected: 4 },
    { input: 5, expected: 5 },
    { input: 6, expected: 5 },
    { input: 60, expected: 5 },
  ])("activeProfile - set and clamp: %i", ({ input, expected }) => {
    kreo.dpi.activeProfile = input as DpiProfileIndex;
    expect(kreo.dpi.activeProfile).toBe(expected);
  });

  it.each([0, 1, 2, 3, 4, 5])(
    "profiles.dpi profiles.enabled- should correctly set and get a DPI profile: %i",
    (index) => {
      kreo.dpi.profiles[index].dpi = 800;
      kreo.dpi.profiles[index].enabled = true;

      expect(kreo.dpi.profiles[index].dpi).toBe(800);
      expect(kreo.dpi.profiles[index].enabled).toBe(true);
    },
  );

  it("profiles.dpi - should correctly clamp DPI", () => {
    kreo.dpi.profiles[1].dpi = 30000;
    expect(kreo.dpi.profiles[1].dpi).toBe(26000);
  });

  it("profiles.dpi - should correctly floor DPI", () => {
    kreo.dpi.profiles[1].dpi = 2549;
    expect(kreo.dpi.profiles[1].dpi).toBe(2500);
  });

  it("profiles.enabled - should disable profile", () => {
    kreo.dpi.profiles[1].enabled = false;
    expect(kreo.dpi.profiles[1].enabled).toBe(false);

    kreo.dpi.profiles[1].enabled = true;
    expect(kreo.dpi.profiles[1].enabled).toBe(true);
  });
});

describe("Lighting", () => {
  it.each([
    { input: -1, expected: 0 },
    { input: 0, expected: 0 },
    { input: 254, expected: 254 },
    { input: 255, expected: 255 },
    { input: 256, expected: 255 },
  ])(
    "lighting.red lighting.green lighting.blue - set, clamp values",
    ({ input, expected }) => {
      kreo.lighting.red = input;
      expect(kreo.lighting.red).toBe(expected);
      kreo.lighting.green = input;
      expect(kreo.lighting.green).toBe(expected);
      kreo.lighting.blue = input;
      expect(kreo.lighting.blue).toBe(expected);
    },
  );

  it("lighting.color - set color: rgba(255, 0, 0, 1)", () => {
    kreo.lighting.color = "rgba(255, 0, 0, 1)";
    expect(kreo.lighting.red).toBe(255);
    expect(kreo.lighting.green).toBe(0);
    expect(kreo.lighting.blue).toBe(0);
  });

  it("lighting.color - set color: rgba(24, 122, 96, 1)", () => {
    kreo.lighting.color = "rgba(24, 122, 96, 1)";
    expect(kreo.lighting.red).toBe(24);
    expect(kreo.lighting.green).toBe(122);
    expect(kreo.lighting.blue).toBe(96);
  });

  it.each(["Off", "Static", "Breathing", "7 Color Breathing", "Marbles"])(
    "lighting.effect: %i",
    (effect) => {
      kreo.lighting.effect = effect as EffectBindingName;
      expect(kreo.lighting.effect).toBe(effect);
    },
  );

  it.each([
    { input: -1, expected: 0 },
    { input: 0, expected: 0 },
    { input: 2, expected: 2 },
    { input: 3, expected: 3 },
    { input: 4, expected: 3 },
  ])("lighting.brightness - set, clamp values", ({ input, expected }) => {
    kreo.lighting.brightness = input as BrightnessConfig;
    expect(kreo.lighting.brightness).toBe(expected);
  });

  it.each([
    { input: -1, expected: 1 },
    { input: 0, expected: 1 },
    { input: 1, expected: 1 },
    { input: 3, expected: 3 },
    { input: 5, expected: 5 },
    { input: 6, expected: 5 },
  ])("lighting.speed - set, clamp values", ({ input, expected }) => {
    kreo.lighting.speed = input;
    expect(kreo.lighting.speed).toBe(expected);
  });

  it.each([
    { input: true, expected: true },
    { input: false, expected: false },
  ])("lighting.moveLightOff - set values", ({ input, expected }) => {
    kreo.lighting.moveLightOff = input;
    expect(kreo.lighting.moveLightOff).toBe(expected);
  });
});

describe("Performance", () => {
  it.each([1000, 500, 250, 125])(
    "performance.reportRate - should set and get valid report rate: %i",
    (rate) => {
      kreo.performance.reportRate = rate as ReportRate;
      expect(kreo.performance.reportRate).toBe(rate);
    },
  );

  it.each([0, 124, 126, 249, 251, 499, 501, 999, 1001])(
    "performance.reportRate - should not set invalid report rate: %i",
    (rate) => {
      expect(() => {
        kreo.performance.reportRate = rate as ReportRate;
      }).toThrowError("Invalid report rate");
    },
  );

  it.each([1, 3, 5, 9])(
    "performance.sleep - should set and get valid sleepValue: %i",
    (sleep) => {
      kreo.performance.sleep = sleep as SleepValue;
      expect(kreo.performance.sleep).toBe(sleep);
    },
  );

  it.each([-1, -2, 6, 7, 100])(
    "performance.sleep - should limit the sleep value: %i",
    (sleep) => {
      kreo.performance.sleep = sleep as SleepValue;
      expect(kreo.performance.sleep).toBeGreaterThanOrEqual(1);
      expect(kreo.performance.sleep).toBeLessThanOrEqual(9);
    },
  );
});

describe("buttonMapping", () => {
  it("should set and get right button to be Left Click", () => {
    kreo.buttonMapping.right = "Left Click";
    expect(kreo.buttonMapping.right).toEqual("Left Click");
  });

  it("should throw error when left click is unbound", () => {
    expect(() => (kreo.buttonMapping.left = "Off")).toThrowError(
      "At least one button must remain mapped to Left Click",
    );
  });

  it("should allow change left button binding first then ", () => {
    kreo.buttonMapping.right = "Left Click";
    kreo.buttonMapping.left = "Off";
    expect(kreo.buttonMapping.right).toEqual("Left Click");
  });

  it("should set and get right button", () => {
    kreo.buttonMapping.right = "Middle Click";
    expect(kreo.buttonMapping.right).toEqual("Middle Click");
  });

  it("should set and get middle button", () => {
    kreo.buttonMapping.middle = "Right Click";
    expect(kreo.buttonMapping.middle).toEqual("Right Click");
  });

  it("should set and get forward button", () => {
    kreo.buttonMapping.forward = "Middle Click";
    expect(kreo.buttonMapping.forward).toEqual("Middle Click");
  });

  it("should set and get back button", () => {
    kreo.buttonMapping.back = "Middle Click";
    expect(kreo.buttonMapping.back).toEqual("Middle Click");
  });

  it("should set and get dpi button", () => {
    kreo.buttonMapping.dpi = "Middle Click";
    expect(kreo.buttonMapping.dpi).toEqual("Middle Click");
  });
});

describe("packet send test", () => {
  it("header and footer test", async () => {
    kreo.lighting.brightness = 2;
    await kreo.sendUpdates();

    const sentReports = device.reports;

    expect(sentReports.length).toBeGreaterThan(0);

    const header = [38, 250, 70];
    const footer = [
      [0x57, 0xfa, 0x40, 0xf3, 0x04],
      [0x48, 0xfa, 0x40, 0xf3, 0x01],
      [0x49, 0xfa, 0x40, 0xf3, 0x02],
      [0x53, 0xfa, 0x40, 0xf3, 0x08],
      [0x5b, 0xfa, 0x40, 0xf3, 0x10],
      [0x27, 0xfa, 0x46, 0x01],
      [0x24, 0xfa, 0x48],
    ];

    const packets = sentReports.map((r) => Array.from(r.data));

    expect(packets.slice(0, 3)).toEqual([
      paddedPacket(header),
      paddedPacket(header),
      paddedPacket(header),
    ]);

    expect(
      packets.slice(packets.length - footer.length, packets.length),
    ).toEqual(footer.map((p) => paddedPacket(p)));
  });

  it("no update when no change", async () => {
    await kreo.sendUpdates();

    const sentReports = device.reports;

    expect(sentReports.length).toBe(0);
  });
});

describe("Packet Update A", () => {
  // Packet A
  it.each([
    { input: true, expected: 0x00 },
    { input: false, expected: 0xff },
  ])("moveLightOff", async ({ input, expected }) => {
    kreo.lighting.moveLightOff = input;
    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0xb9);

    expect(packet).toBeDefined();
    expect(packet?.[14]).toBe(expected);
  });

  it("sleep", async () => {
    kreo.performance.sleep = 3;
    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0xb9);

    expect(packet).toBeDefined();
    expect(packet?.[15]).toBe(0x03);
  });

  it("reportRate", async () => {
    kreo.performance.reportRate = 1000;
    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0xb9);

    expect(packet).toBeDefined();
    expect(packet?.[18]).toBe(0x01);
  });

  it("activeProfile", async () => {
    kreo.dpi.activeProfile = 3;
    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0xb9);

    expect(packet).toBeDefined();
    expect(packet?.[24]).toBe(0x03);
  });

  it("effect", async () => {
    kreo.lighting.effect = "Breathing";
    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0xb9);

    expect(packet).toBeDefined();
    expect(packet?.[25]).toBe(0x03);
  });
});

describe("Packet Update D", () => {
  it("red", async () => {
    kreo.lighting.red = 100;

    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0x81);

    expect(packet).toBeDefined();
    expect(packet?.[16]).toBe(100);
  });

  it("green", async () => {
    kreo.lighting.green = 100;

    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0x81);

    expect(packet).toBeDefined();
    expect(packet?.[17]).toBe(100);
  });

  it("blue", async () => {
    kreo.lighting.blue = 100;

    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0x81);

    expect(packet).toBeDefined();
    expect(packet?.[18]).toBe(100);
  });

  it("rgba(200, 100, 69, 1)", async () => {
    kreo.lighting.color = "rgba(200, 100, 69, 1)";

    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0x81);

    expect(packet).toBeDefined();
    expect([packet?.[16], packet?.[17], packet?.[18]]).toStrictEqual([
      200, 100, 69,
    ]);
  });

  it("brightness", async () => {
    kreo.lighting.brightness = 2;

    await kreo.sendUpdates();

    const packets = device.reports.map((r) => Array.from(r.data));

    const packet = packets.find((packet) => packet[0] === 0x81);

    expect(packet).toBeDefined();
    expect(packet?.[22]).toBe(2);
  });
});
