import React, { useState, useEffect } from "react";
import axios from "axios";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@mui/joy";
import { format } from "date-fns";
import ForecastReportPDF, { ReportViewer } from "./ForecastReportPDF";
import ForecastReportCSV from "./ForecastReportCSV";
import ForecastReportTXT from "./ForecastReportTXT";

const timestamp = `tanawPH_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;

const ForecastDownload = ({
  serverToken,
  forecast,
  docFormat,
  docUnits,
  docColored,
  location,
  docExtendForecast,
  selectedMunicities,
}) => {
  const [forecastExtend, setForecastExtend] = useState([]);

  useEffect(() => {
    const fetchForecastExtend = async () => {
      const forecasts = await Promise.all(
        selectedMunicities.map(async (municity) => {
          const response = await axios.get("/fullInternal", {
            params: {
              municity: municity,
              province: forecast.province,
            },
            headers: {
              token: serverToken,
            },
          });
          return response.data;
        })
      );
      setForecastExtend(forecasts);
    };

    fetchForecastExtend();
  }, [selectedMunicities]);

  const downloadButton = () => {
    switch (docFormat) {
      case "pdf":
        return (
          <PDFDownloadLink
            document={
              <ForecastReportPDF
                location={location}
                forecast={forecast}
                docUnits={docUnits}
                docColored={docColored}
                docExtendForecast={docExtendForecast}
                forecastExtend={forecastExtend}
              />
            }
            fileName={timestamp}
          >
            {({ blob, url, loading, error }) => (
              <Button
                loading={loading}
                sx={{
                  flexGrow: 1,
                  width: "-webkit-fill-available",
                }}
              >
                {error ? `Error: ${error.message}` : "Download"}
              </Button>
            )}
          </PDFDownloadLink>
        );
      case "csv":
        return (
          <ForecastReportCSV
            forecast={forecast}
            docUnits={docUnits}
            docExtendForecast={docExtendForecast}
            forecastExtend={forecastExtend}
          />
        );
      case "txt":
        return (
          <ForecastReportTXT
            forecast={forecast}
            docUnits={docUnits}
            docExtendForecast={docExtendForecast}
            forecastExtend={forecastExtend}
          />
        );
    }
  };
  return (
    <>
      {docFormat === "pdf" ? (
        <ReportViewer
          location={location}
          forecast={forecast}
          docUnits={docUnits}
          docColored={docColored}
          docExtendForecast={docExtendForecast}
          forecastExtend={forecastExtend}
        />
      ) : null}

      {downloadButton()}
    </>
  );
};

export default ForecastDownload;
