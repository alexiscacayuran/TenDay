import React from "react";
import { Svg, Rect } from "@react-pdf/renderer";

const VerticalBarGraph = ({
  value = 0, // Range: 0–100
  maxHeight = 50, // Total height of the bar
  width = 45, // Total width of the bar
  padding = 2, // Padding inside the bar
  fillColor = "#3e7bff",
  strokeColor = "#ccc",
  borderRadius = 4, // Radius for outer border
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const innerHeight = maxHeight - padding * 2;
  const scaledHeight = (clampedValue / 100) * innerHeight;
  const innerWidth = width - padding * 2;
  const yPosition = maxHeight - padding - scaledHeight;

  return (
    <Svg width={width} height={maxHeight}>
      {/* Outer pill container */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={maxHeight}
        stroke={strokeColor}
        fill="white"
        strokeWidth={0.5}
        rx={borderRadius}
        ry={borderRadius}
      />

      {/* Inner filled bar (with padding and rounded shape) */}
      <Rect
        x={padding}
        y={yPosition}
        width={innerWidth}
        height={scaledHeight}
        fill={fillColor}
        rx={innerWidth / 2}
        ry={innerWidth / 2}
      />
    </Svg>
  );
};

export default VerticalBarGraph;
