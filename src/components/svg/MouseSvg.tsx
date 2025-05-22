import { ButtonName, MouseSvgProps } from "@/types";

export const MouseSvg = ({ selectedKey, onSelect, paths }: MouseSvgProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    // width="426"
    height="526"
    version="1.1"
    viewBox="100 0 426 626"
  >
    <g>
      {paths.map(({ d, key, interactive = true }) => (
        <path
          key={key}
          d={d}
          fill={
            !interactive ? "#444" : selectedKey === key ? "#c084fc" : "#666"
          }
          style={{
            cursor: "pointer",
            transition: "fill 0.2s ease",
          }}
          strokeWidth="0.337"
          display="inline"
          onClick={() => onSelect(key as ButtonName)}
        />
      ))}
    </g>
  </svg>
);
