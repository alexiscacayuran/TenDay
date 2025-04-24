import React from "react";
import {
  Page,
  Image,
  Text,
  View,
  Document,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@mui/joy";
import { format } from "date-fns";
import ForecastReportPDF, { ReportViewer } from "./ForecastReportPDF";
import ForecastReportCSV from "./ForecastReportCSV";
import ForecastReportTXT from "./ForecastReportTXT";

const timestamp = `tanawPH_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;

const downloadButton = (
  forecast,
  docFormat,
  docUnits,
  docColored,
  location,
  docExtendForecast,
  selectedMunicities
) => {
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
              selectedMunicities={selectedMunicities}
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
          selectedMunicities={selectedMunicities}
        />
      );
    case "txt":
      return (
        <ForecastReportTXT
          forecast={forecast}
          docUnits={docUnits}
          docExtendForecast={docExtendForecast}
          selectedMunicities={selectedMunicities}
        />
      );
  }
};

const ForecastDownload = ({
  forecast,
  docFormat,
  docUnits,
  docColored,
  location,
  docExtendForecast,
  selectedMunicities,
}) => {
  return (
    <>
      {docFormat === "pdf" ? (
        <ReportViewer
          location={location}
          forecast={forecast}
          docUnits={docUnits}
          docColored={docColored}
          docExtendForecast={docExtendForecast}
          selectedMunicities={selectedMunicities}
        />
      ) : null}

      {downloadButton(
        forecast,
        docFormat,
        docUnits,
        docColored,
        location,
        docExtendForecast,
        selectedMunicities
      )}
    </>
  );
};

export default ForecastDownload;
