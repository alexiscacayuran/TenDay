import React from "react";

const ForecastTooltip = ({ forecast }) => {
  if (!forecast) return null;

  const {
    date,
    start_date,
    rainfall,
    cloud_cover,
    temperature,
    humidity,
    wind,
  } = forecast;

  return (
    <div>
      <h4>Forecast for {date}</h4>
      <p>
        <strong>Start Date:</strong> {start_date}
      </p>
      <p>
        <strong>Rainfall:</strong> {rainfall}
      </p>
      <p>
        <strong>Cloud Cover:</strong> {cloud_cover}
      </p>
      <p>
        <strong>Temperature:</strong> Mean {temperature.mean}°C, Min{" "}
        {temperature.min}°C, Max {temperature.max}°C
      </p>
      <p>
        <strong>Humidity:</strong> {humidity}%
      </p>
      <p>
        <strong>Wind:</strong> {wind.speed} m/s {wind.direction}
      </p>
    </div>
  );
};

export default ForecastTooltip;
