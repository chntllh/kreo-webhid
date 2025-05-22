import {
  Checkbox,
  Flex,
  HStack,
  NumberInput,
  Stack,
  Tabs,
} from "@chakra-ui/react";
import { CardComponent } from "../ui/CardComponent";
import { SliderComponent } from "../ui/SliderComponent";
import { useState } from "react";
import { ActiveProfileConfig, DpiProfileConfig } from "@/types";
import { KreoDevice } from "@/api/HIDDevice";

const DPIProfilePanel = ({ device }: { device: KreoDevice }) => {
  const activeProfile = device.configuration.dpi.activeProfile;
  const profiles = device.configuration.dpi.profiles;

  const [activeIndex, setActiveIndex] = useState(0);
  const [tabValue, setTabValue] = useState(`dpi-${activeProfile + 1}`);
  const [localDpi, setLocalDpi] = useState(
    profiles.map((profile) => profile.dpi),
  );
  const [localEnabled, setLocalEnabled] = useState(
    profiles.map((profile) => profile.enabled),
  );

  const profileColors = [
    "yellow.300",
    "green.500",
    "cyan.500",
    "pink.300",
    "blue.400",
    "red.500",
  ];

  const updateDpiForProfile = (profileIndex: number, newDpi: number) => {
    setLocalDpi((prev) => {
      const updated = [...prev];
      updated[profileIndex] = newDpi;
      return updated;
    });
  };

  return (
    <Flex direction={"column"} alignItems={"center"} p={4} gap={4}>
      <CardComponent title="Active DPI Profile">
        <SliderComponent
          value={[activeProfile]}
          onValueChange={(details) => {
            const newIndex = details.value[0] as ActiveProfileConfig;
            device.dpi.activeProfile = newIndex;
            setActiveIndex(newIndex);
            setTabValue(`dpi-${newIndex + 1}`);
          }}
          min={0}
          max={5}
          step={1}
          marks={[
            { value: 0, label: 1 },
            { value: 1, label: 2 },
            { value: 2, label: 3 },
            { value: 3, label: 4 },
            { value: 4, label: 5 },
            { value: 5, label: 6 },
          ]}
        />
      </CardComponent>

      <CardComponent width={800}>
        <Tabs.Root
          value={tabValue}
          colorPalette={"black"}
          size={"lg"}
          variant="plain"
          fitted
          onValueChange={(details) => {
            setTabValue(details.value);
            const i = parseInt(details.value.split("-")[1], 10) - 1;
            setActiveIndex(i);
          }}
        >
          <Tabs.List
            bg="gray.800"
            color="white"
            borderColor="gray.600"
            rounded="l3"
            p="1"
          >
            {profiles.map((_: DpiProfileConfig, i: number) => {
              const color = profileColors[i];
              return (
                <Tabs.Trigger
                  key={`dpi-${i + 1}`}
                  value={`dpi-${i + 1}`}
                  textStyle={"xl"}
                  color={color}
                  _selected={{
                    bg: color,
                    color: "black",
                  }}
                >
                  DPI {i + 1}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          <Tabs.Content value={tabValue}>
            <Stack gap={"4"} colorPalette={"purple"}>
              <Checkbox.Root
                checked={localEnabled[activeIndex]}
                onCheckedChange={(details) => {
                  setLocalEnabled((prev) => {
                    const updated = [...prev];
                    updated[activeIndex] = !!details.checked;
                    return updated;
                  });
                  profiles[activeIndex].enabled =
                    !profiles[activeIndex].enabled;
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Label color={"white"}>Enabled</Checkbox.Label>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
              </Checkbox.Root>

              <HStack width={"100%"}>
                <NumberInput.Root
                  value={localDpi[activeIndex].toString()}
                  onValueChange={(details) => {
                    updateDpiForProfile(activeIndex, Number(details.value));
                  }}
                  onKeyDown={(details) => {
                    if (details.key === "Enter") {
                      const val =
                        Math.floor(Number(localDpi[activeIndex]) / 50) * 50;
                      const clampedVal = Math.min(Math.max(val, 50), 26000);
                      device.dpi.profiles[activeIndex].dpi = clampedVal;
                    }
                  }}
                  onBlur={() => {
                    const val =
                      Math.floor(Number(localDpi[activeIndex]) / 50) * 50;
                    const clampedVal = Math.min(Math.max(val, 50), 26000);
                    device.dpi.profiles[activeIndex].dpi = clampedVal;
                  }}
                  min={50}
                  max={26000}
                  step={50}
                  width={"24"}
                  color={"white"}
                >
                  <NumberInput.Control>
                    <NumberInput.IncrementTrigger />
                    <NumberInput.DecrementTrigger />
                  </NumberInput.Control>
                  <NumberInput.Scrubber />
                  <NumberInput.Input />
                </NumberInput.Root>

                <SliderComponent
                  value={[localDpi[activeIndex]]}
                  onValueChange={(details) =>
                    updateDpiForProfile(activeIndex, details.value[0])
                  }
                  onValueChangeEnd={(details) => {
                    device.dpi.profiles[activeIndex].dpi = details.value[0];
                  }}
                  min={50}
                  max={26000}
                  step={50}
                  marks={Array.from({ length: 27 }, (_, i) => ({
                    value: i * 1000,
                    label: undefined,
                  }))}
                />
              </HStack>
            </Stack>
          </Tabs.Content>
        </Tabs.Root>
      </CardComponent>
    </Flex>
  );
};

export default DPIProfilePanel;
