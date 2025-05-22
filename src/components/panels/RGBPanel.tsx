import {
  effectBindingKeys,
  EffectBindingName,
  KreoDevice,
} from "@/api/HIDDevice";
import {
  ColorPicker,
  ColorPickerChannelSlider,
  Flex,
  HStack,
  NativeSelect,
  parseColor,
  Portal,
} from "@chakra-ui/react";
import { CardComponent } from "../ui/CardComponent";
import { SliderComponent } from "../ui/SliderComponent";
import { BrightnessConfig } from "@/types";

export const RGBPanel = ({ device }: { device: KreoDevice }) => {
  return (
    <Flex
      wrap={"wrap"}
      direction={"column"}
      alignItems={"center"}
      p={4}
      gap={4}
    >
      <CardComponent title="Color">
        <ColorPicker.Root
          defaultValue={parseColor(device.lighting.color)}
          onValueChangeEnd={(details) => {
            device.lighting.color = details.valueAsString;
          }}
          size={"xl"}
        >
          <ColorPicker.HiddenInput />
          <ColorPicker.Control>
            <ColorPicker.Input colorPalette={"purple"} />
            <ColorPicker.Trigger />
          </ColorPicker.Control>
          <Portal>
            <ColorPicker.Positioner>
              <ColorPicker.Content>
                <ColorPicker.Area />
                <HStack>
                  <ColorPickerChannelSlider channel="hue" />
                </HStack>
              </ColorPicker.Content>
            </ColorPicker.Positioner>
          </Portal>
        </ColorPicker.Root>
      </CardComponent>

      <CardComponent title="Effect">
        <NativeSelect.Root>
          <NativeSelect.Field
            defaultValue={device.lighting.effect}
            onChange={(details) =>
              (device.lighting.effect = details.currentTarget
                .value as EffectBindingName)
            }
          >
            {effectBindingKeys.map((effect) => (
              <option value={effect} key={effect}>
                {effect}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </CardComponent>

      <CardComponent title="Brightness">
        <SliderComponent
          defaultValue={[device.lighting.brightness]}
          onValueChangeEnd={(details) => {
            device.lighting.brightness = details.value[0] as BrightnessConfig;
          }}
          min={0}
          max={3}
          step={1}
          marks={[
            { value: 0, label: 0 },
            { value: 1, label: 1 },
            { value: 2, label: 2 },
            { value: 3, label: 3 },
          ]}
        />
      </CardComponent>

      <CardComponent title="Speed">
        <SliderComponent
          defaultValue={[device.lighting.speed]}
          onValueChangeEnd={(details) => {
            device.lighting.speed = details.value[0];
          }}
          min={1}
          max={5}
          step={1}
          marks={[
            { value: 1, label: 1 },
            { value: 2, label: 2 },
            { value: 3, label: 3 },
            { value: 4, label: 4 },
            { value: 5, label: 5 },
          ]}
        />
      </CardComponent>
    </Flex>
  );
};
