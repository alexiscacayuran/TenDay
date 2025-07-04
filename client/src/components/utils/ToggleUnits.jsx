import React from "react";
import { Button, Link, Box, Typography } from "@mui/joy";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/joy/styles";

// Helper function to toggle units
export const handleToggle = (prevUnits, overlay) => {
  const unitChoices = {
    temperature: ["°C", "°F"],
    rainfall: ["mm/day", "in/day"],
    windSpeed: ["m/s", "km/h", "kt"],
    windDirection: ["arrow", "desc"],
  };

  const getNextUnit = (currentUnit, choices) => {
    const currentIndex = choices.indexOf(currentUnit);
    return choices[(currentIndex + 1) % choices.length];
  };

  const updatedUnits = { ...prevUnits };

  if (overlay.includes("temperature")) {
    updatedUnits.temperature = getNextUnit(
      prevUnits.temperature,
      unitChoices.temperature
    );
  } else if (overlay === "wind" || overlay === "wind_speed") {
    updatedUnits.windSpeed = getNextUnit(
      prevUnits.windSpeed,
      unitChoices.windSpeed
    );
  } else if (overlay === "rainfall") {
    updatedUnits.rainfall = getNextUnit(
      prevUnits.rainfall,
      unitChoices.rainfall
    );
  } else if (overlay === "wind_direction") {
    updatedUnits.windDirection = getNextUnit(
      prevUnits.windDirection,
      unitChoices.windDirection
    );
  }

  return updatedUnits;
};

const ToggleUnits = ({ context, overlay, units, setUnits, ...props }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const adaptiveColor = !isMobile
    ? "var(--joy-palette-neutral-700, #32383E)"
    : "common.white";

  const toggleUnits = () => {
    setUnits((prevUnits) => handleToggle(prevUnits, overlay));
  };

  return (
    <>
      {context === "popup" ? (
        overlay.includes("temperature") ? (
          <Link
            underline="always"
            level="h4"
            sx={{ color: "var(--joy-palette-neutral-700, #32383E)" }}
            onClick={toggleUnits}
            className="forecast-units"
          >
            {units.temperature}
          </Link>
        ) : overlay === "rainfall" ? (
          <Link
            underline="always"
            level="h4"
            sx={{ color: "var(--joy-palette-neutral-700, #32383E)" }}
            onClick={toggleUnits}
            className="forecast-units"
          >
            {units.rainfall}
          </Link>
        ) : overlay === "humidity" ? (
          <>%</>
        ) : overlay === "wind" ? (
          <Link
            underline="always"
            level="h4"
            sx={{ color: "var(--joy-palette-neutral-700, #32383E)" }}
            onClick={toggleUnits}
            className="forecast-units"
          >
            {units.windSpeed}
          </Link>
        ) : overlay === "cloud" ? null : null
      ) : context === "container" ? (
        overlay.includes("temperature") ? (
          <Button {...props} onClick={toggleUnits}>
            {units.temperature}
          </Button>
        ) : overlay === "rainfall" ? (
          <Button {...props} onClick={toggleUnits}>
            {units.rainfall}
          </Button>
        ) : overlay === "humidity" ? (
          <Box sx={{ margin: "4px 12px" }}>%</Box>
        ) : overlay === "wind_speed" ? (
          <Button {...props} onClick={toggleUnits}>
            {units.windSpeed}
          </Button>
        ) : overlay === "wind_direction" ? (
          <Button {...props} onClick={toggleUnits}>
            {units.windDirection}
          </Button>
        ) : null
      ) : context === "legend" ? (
        overlay.includes("temperature") ? (
          <Link
            className="legend-units"
            level="body-sm"
            sx={{ color: adaptiveColor, textDecorationColor: adaptiveColor }}
            onClick={toggleUnits}
          >
            {units.temperature}
          </Link>
        ) : overlay === "rainfall" ? (
          <Link
            className="legend-units"
            level="body-sm"
            sx={{
              color: adaptiveColor,
              textDecorationColor: adaptiveColor,
            }}
            onClick={toggleUnits}
          >
            {units.rainfall.slice(0, 2)}
          </Link>
        ) : overlay === "humidity" ? (
          <Typography
            className="legend-units"
            level="body-sm"
            sx={{ color: adaptiveColor, textDecorationColor: adaptiveColor }}
          >
            %
          </Typography>
        ) : overlay === "wind" ? (
          <Link
            className="legend-units"
            level="body-sm"
            sx={{ color: adaptiveColor, textDecorationColor: adaptiveColor }}
            onClick={toggleUnits}
          >
            {units.windSpeed}
          </Link>
        ) : overlay === "cloud" ? (
          <Typography
            className="legend-units"
            level="body-sm"
            sx={{ color: adaptiveColor, textDecorationColor: adaptiveColor }}
          >
            %
          </Typography>
        ) : null
      ) : null}
    </>
  );
};

export default ToggleUnits;
