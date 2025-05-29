import React from "react";
import convert from "convert-units";

export const convertValue = (overlay, units, value) => {
  switch (true) {
    case overlay.includes("temperature"):
      return units.temperature === "°F"
        ? parseFloat(convert(value).from("C").to("F").toFixed(1))
        : parseFloat(convert(value).from("C").to("C").toFixed(1));
    case overlay.includes("rainfall"):
      return units.rainfall === "in/day"
        ? parseFloat(convert(value).from("mm").to("in").toFixed(1))
        : parseFloat(convert(value).from("mm").to("mm").toFixed(1));
    case overlay.includes("wind"):
      if (units.windSpeed === "km/h") {
        return parseFloat(convert(value).from("m/s").to("km/h").toFixed(1));
      } else if (units.windSpeed === "kt") {
        return parseFloat(convert(value).from("m/s").to("knot").toFixed(1));
      } else return parseFloat(convert(value).from("m/s").to("m/s").toFixed(1));
    default:
      return value;
  }
};

const ForecastValue = ({ overlay, units, value, context }) => {
  const converted = convertValue(overlay, units, value);

  // If legend context, round down to whole number
  if (context === "legend") {
    return <>{Math.floor(converted)}</>;
  }

  // If table context and temperature, append degree symbol
  if (context === "table" && overlay.includes("temperature")) {
    return <>{`${converted}°`}</>;
  }

  return <>{converted}</>;
};

export default ForecastValue;
