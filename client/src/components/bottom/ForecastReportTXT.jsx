import React from "react";
import { flattenForecast } from "./ForecastReportCSV";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import csvToMarkdown from "csv-to-markdown-table";
import { Button } from "@mui/joy";

const headers = [
  "municity",
  "province",
  "date",
  "rainfall_total",
  "rainfall_total_unit",
  "rainfall_desc",
  "cloud_cover_desc",
  "max_temp",
  "mean_temp",
  "min_temp",
  "temp_unit",
  "wind_speed",
  "wind_speed_unit",
  "wind_direction",
  "wind_direction_unit",
  "humidity",
  "humidity_unit",
];

const createRows = (data, headers) => {
  const rows = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => row[h]).join(",")),
  ];
  return rows.join("\n");
};

const ForecastReportTXT = ({
  forecast,
  docUnits,
  docExtendForecast,
  forecastExtended,
}) => {
  const downloadForecast = () => {
    const txtData = flattenForecast(
      forecast,
      docUnits,
      docExtendForecast,
      forecastExtended
    );
    const string = createRows(txtData, headers);
    const markdown = csvToMarkdown(string, ",", true);

    const blob = new Blob([markdown], {
      type: "text/plain;charset=utf-8",
    });
    const filename = `tenday-${format(new Date(), "yyyyMMdd-HHmmss")}.txt`;
    saveAs(blob, filename);
  };

  return <Button onClick={downloadForecast}>Download</Button>;
};

export default ForecastReportTXT;
