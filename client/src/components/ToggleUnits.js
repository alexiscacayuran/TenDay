import React, { useState } from "react";
import { Button, Link, Box } from "@mui/joy";

const ToggleUnits = ({ context, overlay, units, setUnits, ...props }) => {
  const [localUnits, setLocalUnits] = useState(units);

  const handleToggle = () => {
    const unitChoices = {
      temperature: ["°C", "°F"],
      rainfall: ["mm/24h", "in/24h"],
      windSpeed: ["m/s", "km/h", "kt"],
      windDirection: ["arrow", "desc"],
    };

    const getNextUnit = (currentUnit, choices) => {
      const currentIndex = choices.indexOf(currentUnit);
      return choices[(currentIndex + 1) % choices.length];
    };

    setUnits((prevUnits) => {
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

      // Set updated state for localUnits and propagate to parent
      setLocalUnits(updatedUnits); // ✅ Correctly update parent state
      return updatedUnits;
    });
  };

  return (
    <>
      {context === "popup" ? (
        overlay.includes("temperature") ? (
          <Link
            underline="always"
            level="h4"
            sx={{ color: "primary.700" }}
            onClick={handleToggle}
            className="forecast-units"
          >
            {localUnits.temperature}
          </Link>
        ) : overlay === "rainfall" ? (
          <Link
            underline="always"
            level="h4"
            sx={{ color: "primary.700" }}
            onClick={handleToggle}
            className="forecast-units"
          >
            {localUnits.rainfall.slice(0, 2)}
          </Link>
        ) : overlay === "humidity" ? (
          <>%</>
        ) : overlay === "wind" ? (
          <Link
            underline="always"
            level="h4"
            sx={{ color: "primary.700" }}
            onClick={handleToggle}
            className="forecast-units"
          >
            {localUnits.windSpeed}
          </Link>
        ) : overlay === "cloud" ? null : null
      ) : context === "container" ? (
        overlay.includes("temperature") ? (
          <Button {...props} onClick={handleToggle}>
            {localUnits.temperature}
          </Button>
        ) : overlay === "rainfall" ? (
          <Button {...props} onClick={handleToggle}>
            {localUnits.rainfall}
          </Button>
        ) : overlay === "humidity" ? (
          <Box sx={{ marginLeft: "12px" }}>%</Box>
        ) : overlay === "wind_speed" ? (
          <Button {...props} onClick={handleToggle}>
            {localUnits.windSpeed}
          </Button>
        ) : overlay === "wind_direction" ? (
          <Button {...props} onClick={handleToggle}>
            {localUnits.windDirection}
          </Button>
        ) : null
      ) : null}
    </>
  );
};

export default ToggleUnits;
