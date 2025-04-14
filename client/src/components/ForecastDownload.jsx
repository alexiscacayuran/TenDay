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
import ForecastReportPDF, { ReportViewer } from "./ForecastReportPDF";

const ForecastDownload = ({
  forecast,
  docFormat,
  docUnits,
  docColored,
  location,
}) => {
  console.log(forecast);
  return (
    <>
      <ReportViewer
        location={location}
        forecast={forecast}
        docUnits={docUnits}
        docColored={docColored}
      />
      <PDFDownloadLink
        document={
          <ForecastReportPDF
            location={location}
            forecast={forecast}
            docUnits={docUnits}
            docColored={docColored}
          />
        }
        fileName="forecast.pdf"
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
    </>
  );
};

export default ForecastDownload;
