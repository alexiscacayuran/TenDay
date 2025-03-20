import React, { useState } from "react";
import { Button, Link } from "@mui/joy";

const ToggleUnits = ({ context, overlay, units, setUnits, ...props }) => {
  const [localUnits, setLocalUnits] = useState(units);
  const handleToggle = () => {
    const unitChoices = {
      temperature: ["°C", "°F"],
      wind: ["m/s", "km/h", "knot"],
      rainfall: ["mm/24h", "in/24h"],
      windDirection: ["arrow", "desc"],
    };

    const getNextUnit = (currentUnit, choices) => {
      const currentIndex = choices.indexOf(currentUnit);
      return choices[(currentIndex + 1) % choices.length];
    };

    let updatedUnits = { ...localUnits };

    if (overlay.includes("temperature")) {
      updatedUnits.temperature = getNextUnit(
        localUnits.temperature,
        unitChoices.temperature
      );
    } else if (overlay === "wind") {
      updatedUnits.windSpeed = getNextUnit(
        localUnits.windSpeed,
        unitChoices.wind
      );
    } else if (overlay === "rainfall") {
      updatedUnits.rainfall = getNextUnit(
        localUnits.rainfall,
        unitChoices.rainfall
      );
    } else if (overlay === "cloud") {
      updatedUnits.windDirection = getNextUnit(
        localUnits.windDirection,
        unitChoices.windDirection
      );
    }

    setLocalUnits(updatedUnits);
    setUnits(updatedUnits);
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
          >
            {localUnits.temperature}
          </Link>
        ) : overlay === "rainfall" ? (
          <Link
            underline="always"
            level="h4"
            sx={{ color: "primary.700" }}
            onClick={handleToggle}
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
          >
            {localUnits.windSpeed}
          </Link>
        ) : overlay === "cloud" ? null : (
          "unit"
        )
      ) : (
        <Button {...props}>Toggle Units</Button>
      )}
    </>
  );
};

export default ToggleUnits;
