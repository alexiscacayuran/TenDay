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

export const flattenForecast = (data, docUnits) => {
  return data.forecasts.map((f) => ({
    municity: data.municity,
    province: data.province,
    date: format(f.date, "MM/dd/yyyy"),
    rainfall_total: convertValue("rainfall", docUnits, f.rainfall.total),
    rainfall_total_unit: docUnits.rainfall,
    rainfall_desc: f.rainfall.description,
    cloud_cover_desc: f.cloud_cover,
    max_temp: convertValue("temperature", docUnits, f.temperature.max),
    mean_temp: convertValue("temperature", docUnits, f.temperature.mean),
    min_temp: convertValue("temperature", docUnits, f.temperature.min),
    temp_unit: docUnits.temperature,
    wind_speed: convertValue("wind", docUnits, f.wind.speed),
    wind_speed_unit: docUnits.windSpeed,
    wind_direction: f.wind.direction,
    wind_direction_unit: "desc",
    humidity: f.humidity,
    humidity_unit: "%",
  }));
};

const ForecastReportCSV = ({ forecast, docUnits }) => {
  const csvData = flattenForecast(forecast, docUnits);

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
