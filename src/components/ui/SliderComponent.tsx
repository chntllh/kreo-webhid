import { Slider, SliderValueChangeDetails } from "@chakra-ui/react";

interface SliderComponentProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (details: SliderValueChangeDetails) => void;
  onValueChangeEnd?: (details: SliderValueChangeDetails) => void;
  min: number;
  max: number;
  step: number;
  marks?: { value: number; label: string | number | undefined }[];
}

export const SliderComponent = ({
  value,
  defaultValue,
  onValueChange,
  onValueChangeEnd,
  min,
  max,
  step,
  marks = [],
}: SliderComponentProps) => {
  const isControlled = value !== undefined;
  return (
    <Slider.Root
      value={isControlled ? value : undefined}
      defaultValue={!isControlled ? defaultValue : undefined}
      onValueChange={isControlled && onValueChange ? onValueChange : undefined}
      onValueChangeEnd={onValueChangeEnd}
      min={min}
      max={max}
      step={step}
      size="lg"
      // mx={12}
      flex={"1"}
    >
      <Slider.Control>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumbs />
        <Slider.Marks marks={marks} />
      </Slider.Control>
    </Slider.Root>
  );
};
