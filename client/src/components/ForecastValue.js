import React from "react";
import convert from "convert-units";

export const convertValue = (overlay, units, value) => {
  switch (true) {
    case overlay.includes("temperature"):
      return units.temperature === "°F"
        ? parseFloat(convert(value).from("C").to("F").toFixed(2))
        : value;
    case overlay.includes("rainfall"):
      return units.rainfall === "in/24h"
        ? parseFloat(convert(value).from("mm").to("in").toFixed(2))
        : value;
    case overlay.includes("wind"):
      if (units.windSpeed === "km/h") {
        return parseFloat(convert(value).from("m/s").to("km/h").toFixed(2));
      } else if (units.windSpeed === "kt") {
        return parseFloat(convert(value).from("m/s").to("knot").toFixed(2));
      } else return value;
    default:
      return value;
  }
};

const ForecastValue = ({ overlay, units, value }) => {
  return <>{convertValue(overlay, units, value)}</>;
};

export default ForecastValue;
