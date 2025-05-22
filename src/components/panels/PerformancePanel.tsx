import { KreoDevice } from "@/api/HIDDevice";
import { Checkbox, Flex } from "@chakra-ui/react";
import { CardComponent } from "../ui/CardComponent";
import { SliderComponent } from "../ui/SliderComponent";
import { SleepConfig } from "@/types";
import { useState } from "react";

const mapReportRateToSlider = (rate: number) => {
  switch (rate) {
    case 125:
      return 0;
    case 250:
      return 1;
    case 500:
      return 2;
    case 1000:
      return 3;
    default:
      return 3;
  }
};

const mapSliderToReportRate = (index: number) => {
  switch (index) {
    case 0:
      return 125;
    case 1:
      return 250;
    case 2:
      return 500;
    case 3:
      return 1000;
    default:
      return 1000;
  }
};

export const PerformancePanel = ({ device }: { device: KreoDevice }) => {
  const [localMoveToLightOff, setLocalMoveToLightOff] = useState(
    device.lighting.moveLightOff,
  );

  return (
    <Flex
      wrap={"wrap"}
      direction={"column"}
      alignItems={"center"}
      p={4}
      gap={4}
    >
      <CardComponent title="Report Rate">
        <SliderComponent
          defaultValue={[mapReportRateToSlider(device.performance.reportRate)]}
          onValueChangeEnd={(details) => {
            device.performance.reportRate = mapSliderToReportRate(
              details.value[0],
            );
          }}
          min={0}
          max={3}
          step={1}
          marks={[
            { value: 0, label: 125 },
            { value: 1, label: 250 },
            { value: 2, label: 500 },
            { value: 3, label: 1000 },
          ]}
        />
      </CardComponent>

      <CardComponent title="Sleep Time">
        <SliderComponent
          defaultValue={[device.performance.sleep]}
          onValueChangeEnd={(details) => {
            device.performance.sleep = details.value[0] as SleepConfig;
          }}
          min={1}
          max={9}
          step={1}
          marks={Array.from({ length: 9 }, (_, i) => ({
            value: i + 1,
            label: i + 1,
          }))}
        />
      </CardComponent>

      <CardComponent title="Move to Light off">
        <Checkbox.Root
          checked={localMoveToLightOff}
          onCheckedChange={(details) => {
            device.lighting.moveLightOff = !!details.checked;
            setLocalMoveToLightOff(!!details.checked);
          }}
          variant={"subtle"}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Label color={"white"}>Enabled</Checkbox.Label>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Root>
      </CardComponent>
    </Flex>
  );
};
