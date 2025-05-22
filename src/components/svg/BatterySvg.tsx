import { BatterySvgProps } from "@/types";

export const BatterySvg: React.FC<BatterySvgProps> = ({ level, scale = 1 }) => {
  const clampLevel = Math.max(0, Math.min(level, 100));

  const getColor = () => {
    if (clampLevel <= 20) return "#f56565"; // red.500
    if (clampLevel <= 40) return "#f6e05e"; // yellow.400
    return "#68d391"; // green.400
  };

  const batteryBodyX = 1;
  const batteryBodyWidth = 36;
  const batteryInnerPadding = 2;
  const batteryFillMaxWidth = batteryBodyWidth - 2 * batteryInnerPadding;

  const fillX = batteryBodyX + batteryInnerPadding;
  const fillWidth = (clampLevel / 100) * batteryFillMaxWidth;

  return (
    <svg width={50 * scale} height={24 * scale} viewBox="0 0 50 24">
      {/* Battery Body */}
      <rect
        x={batteryBodyX}
        y="4"
        width={batteryBodyWidth}
        height="16"
        rx="2"
        ry="2"
        stroke="white"
        fill="none"
        strokeWidth="2"
      />
      {/* Battery Tip */}
      <rect x="36" y="8" width="4" height="8" rx="1" fill="white" />
      {/* Battery Fill */}
      <rect
        x={fillX}
        y="6"
        width={fillWidth}
        height="12"
        rx="1"
        ry="1"
        // fill="currentColor"
        fill={getColor()}
      />
    </svg>
  );
};
