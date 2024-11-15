import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

import { Slide } from "@mui/material";
import { Box, Button, Sheet, Typography, IconButton, Table } from "@mui/joy";
import CloseIcon from "@mui/icons-material/Close";

const ForecastContainer = ({ open, setOpen, location }) => {
  const [forecast, setForecast] = useState(null);
  console.log(forecast);

  useEffect(() => {
    // When open is true, disable body scroll
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = ""; // Re-enable scroll when closed
    }

    // Cleanup function to reset overflow on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    axios
      .get("/full", {
        params: {
          municity: location.municity,
          province: location.province,
        },
      })
      .then((res) => {
        setForecast(res.data);
      })
      .catch((error) => {
        console.error(error);
        setForecast(null);
      });
  }, [location]);

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
        }}
      >
        <Sheet
          className="glass"
          sx={{
            position: "relative",
            p: 2,
            bgcolor: "background.body",
            borderRadius: "sm",
            boxShadow: "lg",
            width: "70vw",
            height: "30vh", // Adjust height as needed
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Close Button */}
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Content inside the Sheet */}
          <Box sx={{ position: "absolute" }}>
            {forecast && (
              <Table size="sm">
                <thead>
                  <tr>
                    <th></th>
                    {forecast.forecasts.map((data, index) => (
                      <th key={index}>{data.date}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Rainfall</td>
                    {forecast.forecasts.map((data, index) => (
                      <td key={index}>{data.rainfall}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Cloud Cover</td>
                    {forecast.forecasts.map((data, index) => (
                      <td key={index}>{data.cloud_cover}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Temperature</td>
                    {forecast.forecasts.map((data, index) => (
                      <td key={index}>{data.temperature.mean}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Humidity</td>
                    {forecast.forecasts.map((data, index) => (
                      <td key={index}>{data.humidity}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Wind speed</td>
                    {forecast.forecasts.map((data, index) => (
                      <td key={index}>{data.wind.speed}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Wind direction</td>
                    {forecast.forecasts.map((data, index) => (
                      <td key={index}>{data.wind.direction}</td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            )}
          </Box>
        </Sheet>
      </Box>
    </Slide>
  );
};

export default ForecastContainer;
