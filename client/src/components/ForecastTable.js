import React, { useState, useEffect } from "react";
import chroma from "chroma-js";
import { Typography, Button } from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const overlayList = [
  {
    name: "temperature_average",
    pathName: "MEAN",
    scale: [
      "#0031FF",
      "#0061FF",
      "#0092FF",
      "#00C2FF",
      "#00F3FF",
      "#24FFDB",
      "#55FFAA",
      "#86FF79",
      "#B6FF49",
      "#E7FF18",
      "#E7FF18",
      "#FFE500",
      "#FFD400",
      "#FFC300",
      "#FFB200",
      "#FF9D00",
      "#FF7E00",
      "#FF5E00",
      "#FF3F00",
      "#FF1F00",
    ],
    domain: chroma.limits([0, 40], "e", 10).map(Math.round),
    mode: "hsl",
    classes: 15,
  },
  {
    name: "temperature_minimum",
    pathName: "MIN",
    scale: [
      "#0031FF",
      "#0061FF",
      "#0092FF",
      "#00C2FF",
      "#00F3FF",
      "#24FFDB",
      "#55FFAA",
      "#86FF79",
      "#B6FF49",
      "#E7FF18",
      "#E7FF18",
      "#FFE500",
      "#FFD400",
      "#FFC300",
      "#FFB200",
      "#FF9D00",
      "#FF7E00",
      "#FF5E00",
      "#FF3F00",
      "#FF1F00",
    ],
    domain: chroma.limits([0, 40], "e", 20).map(Math.round),
    mode: "hsl",
    classes: 15,
  },
  {
    name: "temperature_maximum",
    pathName: "MAX",
    scale: [
      "#0031FF",
      "#0061FF",
      "#0092FF",
      "#00C2FF",
      "#00F3FF",
      "#24FFDB",
      "#55FFAA",
      "#86FF79",
      "#B6FF49",
      "#E7FF18",
      "#E7FF18",
      "#FFE500",
      "#FFD400",
      "#FFC300",
      "#FFB200",
      "#FF9D00",
      "#FF7E00",
      "#FF5E00",
      "#FF3F00",
      "#FF1F00",
    ],
    domain: chroma.limits([0, 40], "e", 20).map(Math.round),
    mode: "hsl",
    classes: 15,
  },
  {
    name: "humidity",
    pathName: "RH",
    scale: ["#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8"],
    domain: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
    mode: "hsl",
    classes: 15,
  },
  {
    name: "wind",
    pathName: "WS",
    scale: [
      "mediumpurple",
      "slateBlue",
      "mediumseagreen",
      "darkorange",
      "mediumvioletred",
    ],
    domain: [
      0.65, 2.5, 4.45, 6.75, 9.4, 12.35, 15.55, 19, 22.65, 26.5, 30.6, 42,
    ],
    mode: "hsl",
    classes: 15,
  },
  {
    name: "rainfall",
    pathName: "TP",
    scale: [
      chroma("#BAB8B8").alpha(0),
      "#BAB8B8",
      "#00C5FF",
      "#6BFB90",
      "#FFFF00",
      "#FFAA00",
      "#FF0000",
      "#FF73DF",
      "#8400A8",
    ],
    domain: [0, 5, 15, 37.5, 75, 150, 250, 400, 500],
    mode: "rgb",
    classes: 35,
  },
  {
    name: "cloud",
    pathName: "TCC",
    scale: [
      "SteelBlue",
      "lightsteelblue",
      chroma("linen").darken(0.2),
      "whitesmoke",
    ],
    domain: [0, 20, 50, 100],
    mode: "lab",
    classes: 15,
  },
];

// Weather parameters configuration
const weatherParams = [
  {
    name: "Temperature",
    key: "temperature",
    unit: "°C",
    overlays: {
      temperature_average: "mean",
      temperature_minimum: "min",
      temperature_maximum: "max",
    },
    icon: faCaretDown,
  },
  {
    name: "Rain",
    key: "rainfall.total",
    unit: "mm/24h",
    overlay: "rainfall",
  },
  {
    name: "Humidity",
    key: "humidity",
    unit: "%",
    overlay: "humidity",
  },
  {
    name: "Wind speed",
    key: "wind.speed",
    unit: "m/s",
    overlay: "wind",
  },
];

// Function to get the correct color scale
const getColorScale = (overlayName) => {
  const overlay = overlayList.find((o) => o.name === overlayName);
  if (!overlay) {
    console.error(`Overlay not found: ${overlayName}`);
    return chroma.scale(["#ffffff", "#000000"]).domain([0, 1]); // Fallback grayscale
  }
  return chroma.scale(overlay.scale).domain(overlay.domain).mode(overlay.mode);
};

// Function to compute median
const getMedian = (a, b) => (a + b) / 2;

const ForecastTable = ({
  forecast,
  overlay,
  setOverlay,
  setIsMenuOpen,
  temp,
  setTemp,
  setActiveTooltip,
}) => {
  const [localOverlay, setLocalOverlay] = useState(overlay);
  const [lastTempOverlay, setLastTempOverlay] = useState("temperature_average"); // Stores last selected temperature overlay
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // If the selected overlay is a temperature type, update lastTempOverlay
    if (
      [
        "temperature_average",
        "temperature_minimum",
        "temperature_maximum",
      ].includes(overlay)
    ) {
      setLastTempOverlay(overlay);
      setLocalOverlay(overlay); // Sync with local state
    }
  }, [overlay]);

  return (
    <>
      {weatherParams.map(
        ({ name, key, unit, overlay: paramOverlay, overlays, icon }) => {
          let activeOverlay = paramOverlay || localOverlay;
          let displayName = name;
          let dataKey = key;

          if (overlays) {
            activeOverlay = lastTempOverlay;
            displayName = `${name} (${overlays[lastTempOverlay]})`;
            dataKey = `${key}.${overlays[lastTempOverlay]}`;
          }

          const colorScale = getColorScale(activeOverlay);

          const handleRowClick = () => {
            if (overlays) {
              const overlayKeys = Object.keys(overlays);
              const nextIndex =
                (overlayKeys.indexOf(lastTempOverlay) + 1) % overlayKeys.length;
              const newOverlay = overlayKeys[nextIndex];

              setLastTempOverlay(newOverlay);
              setOverlay(newOverlay);
              setTemp(newOverlay); // Update temp in LayerMenu
              setIsMenuOpen(true); // Open the menu
              setActiveTooltip("Temperature"); // Sync tooltip to Temperature
            }
          };

          return (
            <tr
              key={name}
              onMouseEnter={() => name === "Temperature" && setHovered(true)}
              onMouseLeave={() => name === "Temperature" && setHovered(false)}
            >
              <th
                onClick={overlays ? handleRowClick : undefined}
                style={{ cursor: overlays ? "pointer" : "default" }}
              >
                <Typography
                  startDecorator={
                    icon && (
                      <motion.div
                        animate={{
                          y: hovered ? [-2, 2, -2] : 0, // Slide only if hovered
                        }}
                        transition={{
                          duration: 0.4,
                          ease: "easeInOut",
                          repeat: Infinity,
                        }}
                      >
                        <FontAwesomeIcon
                          icon={icon}
                          style={{
                            fontSize: "1rem",
                            marginLeft: "12px",
                            color: "#12467B",
                          }}
                        />
                      </motion.div>
                    )
                  }
                  sx={{ justifyContent: "space-between" }}
                  level="title-sm"
                >
                  {displayName}
                </Typography>
              </th>
              <th>
                <Button
                  color="neutral"
                  size="sm"
                  variant="plain"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {unit}
                </Button>
              </th>
              {forecast.forecasts.map((data, index, arr) => {
                const values = arr.map((d) => {
                  let val = key.split(".").reduce((o, k) => o?.[k], d);
                  return typeof val === "object"
                    ? val[overlays?.[lastTempOverlay]]
                    : val ?? 0;
                });

                const left = values[index - 1] ?? values[index];
                const current = values[index];
                const right = values[index + 1] ?? values[index];

                const background =
                  activeOverlay === overlay
                    ? `linear-gradient(to right, ${colorScale(
                        getMedian(left, current)
                      ).css()}, ${colorScale(current).css()}, ${colorScale(
                        getMedian(current, right)
                      ).css()})`
                    : "transparent";

                const color =
                  activeOverlay === overlay
                    ? chroma.deltaE(colorScale(current), "white") <= 40
                      ? "inherit"
                      : "white"
                    : "inherit";

                return (
                  <td key={index} style={{ background, color }}>
                    {current}
                  </td>
                );
              })}
            </tr>
          );
        }
      )}
    </>
  );
};

export default ForecastTable;
