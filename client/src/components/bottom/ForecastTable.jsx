import React, { useState, useEffect, useMemo, memo } from "react";
import chroma from "chroma-js";
import { Typography, Link } from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { getColorScale } from "../utils/OverlayList";
import ToggleUnits from "../utils/ToggleUnits";
import ForecastValue from "../utils/ForecastValue";
import useMediaQuery from "@mui/material/useMediaQuery";
import { generateDateRange } from "./DateSlider";

const weatherParams = [
  {
    name: "Rainfall",
    key: "rainfall.total",
    overlay: "rainfall",
    overlayRef: "rainfall",
  },
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
  sliderRef,
  initialDate,
}) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const [lastTempOverlay, setLastTempOverlay] = useState("temperature_mean");

  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (
      [
        "temperature_mean",
        "temperature_minimum",
        "temperature_maximum",
      ].includes(overlay)
    ) {
      setLastTempOverlay(overlay);
    }
  }, [overlay]);

  const dateRange = useMemo(() => {
    const padding = Array.from({ length: 4 }, () => null);
    return [...generateDateRange(initialDate, 10), ...padding];
  }, [initialDate]);

  return (
    <>
      {weatherParams.map(
        ({
          name,
          key,
          overlay: paramOverlay,
          overlays = {},
          icon,
          overlayRef,
        }) => {
          const isTemperature = Object.keys(overlays).length > 0;
          const activeOverlay = isTemperature ? lastTempOverlay : paramOverlay;
          const colorScale = getColorScale(activeOverlay);

          let displayName = name;
          let dataKey;

          if (isTemperature) {
            const label = overlays?.[lastTempOverlay] ?? "";
            displayName = `${
              label.charAt(0).toUpperCase() + label.slice(1)
            } Temperature`;
            dataKey = `${key}.${label}`;
          }

          const handleRowClick = () => {
            if (isTemperature) {
              const keys = Object.keys(overlays);
              const nextIndex =
                (keys.indexOf(lastTempOverlay) + 1) % keys.length;
              const newOverlay = keys[nextIndex];

              setLastTempOverlay(newOverlay);
              setOverlay(newOverlay);
              setTemp(newOverlay);
              setIsMenuOpen(true);
              setActiveTooltip("Temperature");
            }
          };

          return (
            <tr
              key={name}
              onMouseEnter={() => name === "Temperature" && setHovered(true)}
              onMouseLeave={() => name === "Temperature" && setHovered(false)}
            >
              <th
                onClick={isTemperature ? handleRowClick : undefined}
                style={{ cursor: isTemperature ? "pointer" : "default" }}
              >
                {isTemperature ? (
                  <Link
                    color="neutral"
                    underline="always"
                    variant="plain"
                    startDecorator={
                      icon && (
                        <motion.div
                          animate={{ y: hovered ? [-2, 2, -2] : 0 }}
                          transition={{
                            duration: hovered ? 0.6 : 0,
                            ease: "easeInOut",
                            repeat: hovered ? Infinity : 0,
                          }}
                        >
                          <FontAwesomeIcon
                            icon={icon}
                            style={{ fontSize: "1rem", marginRight: "8px" }}
                          />
                        </motion.div>
                      )
                    }
                    sx={{
                      justifyContent: "flex-end",
                      textDecorationStyle: "dotted",
                    }}
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
                  const val = key.split(".").reduce((o, k) => o?.[k], d);
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
                      ? colorScale(current).css()
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
                    style={{ background, color }}
                    onMouseEnter={() => handleMouseEnter(index + 2)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                      if (isClickValid.current) {
                        setActiveColumn(index + 3);
                        if (!isMobile) setDate(data.date);

                        const idx = dateRange.findIndex(
                          (d) =>
                            d?.toDateString() ===
                            new Date(data.date).toDateString()
                        );

                        if (sliderRef.current && idx >= 0) {
                          sliderRef.current.slickGoTo(idx, true);
                        }
                      }
                    }}
                  >
                    <ForecastValue
                      value={current}
                      overlay={overlayRef}
                      units={units}
                      context="table"
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

const areEqual = (prev, next) =>
  prev.overlay === next.overlay &&
  prev.forecast === next.forecast &&
  prev.units === next.units &&
  prev.hoveredColumn === next.hoveredColumn &&
  prev.initialDate === next.initialDate;

export default memo(ForecastTable, areEqual);
