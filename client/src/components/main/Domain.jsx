import React from "react";
import { SVGOverlay } from "react-leaflet";

const par = [
  [5, 115], // Southwest corner (lat, lng)
  [25, 135], // Northeast corner
];

const tcad = [
  [4, 114],
  [27, 145],
];

const tcid = [
  [0, 110],
  [27, 155],
];

// Polygon coordinates (converted to x/y in SVGOverlay space)
const polygonPoints = [
  [5, 115],
  [15, 115],
  [21, 120],
  [25, 120],
  [25, 135],
  [5, 135],
]
  .map(([lat, lng]) => {
    // Convert lat/lng to SVG relative coordinates inside the overlay
    const x = ((lng - 115) / (135 - 115)) * 100;
    const y = ((25 - lat) / (25 - 5)) * 100; // Flip Y because SVG y=0 is top
    return `${x},${y}`;
  })
  .join(" ");

const Domain = () => {
  return (
    <>
      <SVGOverlay bounds={par}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points={polygonPoints}
            fill="none"
            stroke="white"
            strokeWidth="0.3"
          />
        </svg>
        <text
          x="99.5%"
          y="99.5%"
          fontSize="10"
          fontFamily="Commissioner Variable, Segoe UI, Helvetica, Arial, sans-serif"
          textAnchor="end"
          fill="white"
          stroke="white"
          strokeWidth="0.02"
        >
          PAR
        </text>
      </SVGOverlay>

      <SVGOverlay bounds={tcad}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="none"
            stroke="white"
            strokeWidth="0.3"
          />
        </svg>
        <text
          x="99.5%"
          y="99.5%"
          fontSize="10"
          fontFamily="Commissioner Variable, Segoe UI, Helvetica, Arial, sans-serif"
          textAnchor="end"
          fill="white"
          stroke="white"
          strokeWidth="0.02"
        >
          TCAD
        </text>
      </SVGOverlay>

      <SVGOverlay bounds={tcid}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="none"
            stroke="white"
            strokeWidth="0.3"
          />
        </svg>
        <text
          x="99.5%"
          y="99.5%"
          fontSize="10"
          fontFamily="Commissioner Variable, Segoe UI, Helvetica, Arial, sans-serif"
          textAnchor="end"
          fill="white"
          stroke="white"
          strokeWidth="0.02"
        >
          TCID
        </text>
      </SVGOverlay>
    </>
  );
};

export default Domain;
