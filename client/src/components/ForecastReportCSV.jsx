import React from "react";
import { CSVLink } from "react-csv";
import { Button } from "@mui/joy";
import { format } from "date-fns";
import { convertValue } from "./ForecastValue";

const timestamp = `tanawPH_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;

const headers = [
  { label: "municity", key: "municity" },
  { label: "province", key: "province" },
  { label: "date", key: "date" },
  { label: "rainfall_total", key: "rainfall_total" },
  { label: "rainfall_total_unit", key: "rainfall_total_unit" },
  { label: "rainfall_desc", key: "rainfall_desc" },
  { label: "cloud_cover_desc", key: "cloud_cover_desc" },
  { label: "max_temp", key: "max_temp" },
  { label: "mean_temp", key: "mean_temp" },
  { label: "min_temp", key: "min_temp" },
  { label: "temp_unit", key: "temp_unit" },
  { label: "wind_speed", key: "wind_speed" },
  { label: "wind_speed_unit", key: "wind_speed_unit" },
  { label: "wind_direction", key: "wind_direction" },
  { label: "wind_direction_unit", key: "wind_direction_unit" },
  { label: "humidity", key: "humidity" },
  { label: "humidity_unit", key: "humidity_unit" },
];

export const flattenForecast = (
  forecast,
  docUnits,
  extend = false,
  forecastExtended = []
) => {
  const mainForecast = forecast.forecasts.map((forecastData) => ({
    municity: forecast.municity,
    province: forecast.province,
    date: format(forecastData.date, "MM/dd/yyyy"),
    rainfall_total: convertValue(
      "rainfall",
      docUnits,
      forecastData.rainfall.total
    ),
    rainfall_total_unit: docUnits.rainfall,
    rainfall_desc: forecastData.rainfall.description,
    cloud_cover_desc: forecastData.cloud_cover,
    max_temp: convertValue(
      "temperature",
      docUnits,
      forecastData.temperature.max
    ),
    mean_temp: convertValue(
      "temperature",
      docUnits,
      forecastData.temperature.mean
    ),
    min_temp: convertValue(
      "temperature",
      docUnits,
      forecastData.temperature.min
    ),
    temp_unit: docUnits.temperature,
    wind_speed: convertValue("wind", docUnits, forecastData.wind.speed),
    wind_speed_unit: docUnits.windSpeed,
    wind_direction: forecastData.wind.direction,
    wind_direction_unit: "desc",
    humidity: forecastData.humidity,
    humidity_unit: "%",
  }));

  if (!extend || !forecastExtended.length) return mainForecast;

  const extendedForecast = forecastExtended.flatMap((forecast) =>
    forecast.forecasts.map((forecastData) => ({
      municity: forecast.municity,
      province: forecast.province,
      date: format(forecastData.date, "MM/dd/yyyy"),
      rainfall_total: convertValue(
        "rainfall",
        docUnits,
        forecastData.rainfall.total
      ),
      rainfall_total_unit: docUnits.rainfall,
      rainfall_desc: forecastData.rainfall.description,
      cloud_cover_desc: forecastData.cloud_cover,
      max_temp: convertValue(
        "temperature",
        docUnits,
        forecastData.temperature.max
      ),
      mean_temp: convertValue(
        "temperature",
        docUnits,
        forecastData.temperature.mean
      ),
      min_temp: convertValue(
        "temperature",
        docUnits,
        forecastData.temperature.min
      ),
      temp_unit: docUnits.temperature,
      wind_speed: convertValue("wind", docUnits, forecastData.wind.speed),
      wind_speed_unit: docUnits.windSpeed,
      wind_direction: forecastData.wind.direction,
      wind_direction_unit: "desc",
      humidity: forecastData.humidity,
      humidity_unit: "%",
    }))
  );

  return [...mainForecast, ...extendedForecast];
};

const ForecastReportCSV = ({
  forecast,
  docUnits,
  docExtendForecast,
  forecastExtended,
}) => {
  const csvData = flattenForecast(
    forecast,
    docUnits,
    docExtendForecast,
    forecastExtended
  );
  console.log("csvData", csvData);
  return (
    <CSVLink data={csvData} headers={headers} filename={timestamp}>
      <Button
        sx={{
          flexGrow: 1,
          width: "-webkit-fill-available",
        }}
      >
        Download
      </Button>
    </CSVLink>
  );
};

export default ForecastReportCSV;
