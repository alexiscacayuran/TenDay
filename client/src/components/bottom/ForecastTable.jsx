import React, { useState, useEffect } from "react";
import chroma from "chroma-js";
import { Typography, Link } from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { getColorScale } from "../utils/OverlayList";
import ToggleUnits from "../utils/ToggleUnits";
import ForecastValue from "../utils/ForecastValue";
import { useTheme } from "@mui/joy/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// Weather parameters configuration
const weatherParams = [
  {
    name: "Temperature",
    key: "temperature",
    overlayRef: "temperature",
    overlays: {
      temperature_mean: "mean",
      temperature_minimum: "min",
      temperature_maximum: "max",
    },
    icon: faCaretDown,
  },
  {
    name: "Rainfall",
    key: "rainfall.total",
    overlay: "rainfall",
    overlayRef: "rainfall",
  },
  {
    name: "Humidity",
    key: "humidity",
    overlay: "humidity",
    overlayRef: "humidity",
  },
  {
    name: "Wind speed",
    key: "wind.speed",
    overlay: "wind",
    overlayRef: "wind_speed",
  },
];

// Function to compute median
const getMedian = (a, b) => (a + b) / 2;

const ForecastTable = ({
  forecast,
  overlay,
  setOverlay,
  setIsMenuOpen,
  setTemp,
  setActiveTooltip,
  units,
  setUnits,
  setActiveColumn,
  setDate,
  handleMouseEnter,
  handleMouseLeave,
  hoveredColumn,
  isDiscrete,
  isClickValid,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [localOverlay, setLocalOverlay] = useState(overlay);
  const [lastTempOverlay, setLastTempOverlay] = useState("temperature_mean"); // Stores last selected temperature overlay
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // If the selected overlay is a temperature type, update lastTempOverlay
    if (
      [
        "temperature_mean",
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
        ({ name, key, overlay: paramOverlay, overlays, icon, overlayRef }) => {
          let activeOverlay = paramOverlay || localOverlay;
          let displayName = name;
          let dataKey = key;

          if (overlays) {
            activeOverlay = lastTempOverlay;
            displayName =
              ` ${overlays[lastTempOverlay]}`.replace(/\b\w/g, (str) =>
                str.toUpperCase()
              ) + " Temperature";
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
                {overlays ? (
                  <Link
                    color="neutral"
                    underline="always"
                    variant="plain"
                    startDecorator={
                      icon && (
                        <motion.div
                          animate={{
                            y: hovered ? [-2, 2, -2] : 0, // Slide only if hovered
                          }}
                          transition={{
                            duration: hovered ? 0.6 : 0, // Only animate when hovered
                            ease: "easeInOut",
                            repeat: hovered ? Infinity : 0, // Only repeat when hovered
                          }}
                        >
                          <FontAwesomeIcon
                            icon={icon}
                            style={{
                              fontSize: "1rem",
                              marginRight: "8px",
                            }}
                          />
                        </motion.div>
                      )
                    }
                    sx={{
                      justifyContent: "flex-end",
                      textDecorationStyle: "dotted",
                    }}
                    sxProps={{}}
                  >
                    {displayName}
                  </Link>
                ) : (
                  <Typography>{displayName}</Typography>
                )}
              </th>
              <th>
                <ToggleUnits
                  color="neutral"
                  size="sm"
                  variant="plain"
                  sx={{
                    fontSize: !isMobile ? "0.8rem" : "0.6rem",
                    minHeight: 0,
                  }}
                  context="container"
                  overlay={overlayRef}
                  units={units}
                  setUnits={setUnits}
                />
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
                    ? isDiscrete
                      ? `${colorScale(current).css()}`
                      : `linear-gradient(to right, ${colorScale(
                          getMedian(left, current)
                        ).css()}, ${colorScale(current).css()}, ${colorScale(
                          getMedian(current, right)
                        ).css()})`
                    : hoveredColumn === index + 2
                    ? "var(--joy-palette-neutral-200, #DDE7EE)"
                    : "#FFF";

                const color =
                  activeOverlay === overlay
                    ? chroma.deltaE(colorScale(current), "white") <= 32
                      ? "inherit"
                      : "white"
                    : "inherit";

                return (
                  <td
                    key={index}
                    style={{
                      background,
                      color,
                    }}
                    onMouseEnter={() => handleMouseEnter(index + 2)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                      if (isClickValid.current) {
                        setActiveColumn(index + 3);
                        setDate(data.date);
                      }
                    }}
                  >
                    <ForecastValue
                      value={current}
                      overlay={overlayRef}
                      units={units}
                      context={"table"}
                    />
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
