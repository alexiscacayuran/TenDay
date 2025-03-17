import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, set } from "date-fns";

import { Slide } from "@mui/material";
import {
  Box,
  Stack,
  Sheet,
  Typography,
  IconButton,
  Table,
  Button,
} from "@mui/joy";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import {
  SunnyIcon,
  NoRainParCloudyIcon,
  NoRainMosCloudyIcon,
  NoRainCloudyIcon,
  LightRainsParCloudyIcon,
  LightRainsMosCloudyIcon,
  LightRainsCloudyIcon,
  ModRainsParCloudyIcon,
  ModRainsMosCloudyIcon,
  ModRainsCloudyIcon,
  HeavyRainsParCloudyIcon,
  HeavyRainsMosCloudyIcon,
  HeavyRainsCloudyIcon,
  NIcon,
  NNEIcon,
  NEIcon,
  ENEIcon,
  EIcon,
  ESEIcon,
  SEIcon,
  SSEIcon,
  SIcon,
  SSWIcon,
  SWIcon,
  WSWIcon,
  WIcon,
  WNWIcon,
  NWIcon,
  NNWIcon,
} from "./CustomIcons";

import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ForecastTable from "./ForecastTable";

const temperatureTypes = ["mean", "max", "min"];

const ForecastContainer = ({
  open,
  setOpen,
  location,
  markerLayer,
  overlay,
  setOverlay,
  setIsMenuOpen,
  temp,
  setTemp,
  setActiveTooltip,
}) => {
  const [forecast, setForecast] = useState(null);

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
    if (!location.municity) return;

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
  }, [open, location]);

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          position: "fixed",
          bottom: 20,
          left: 0,
          width: "100%",
          zIndex: 800,
        }}
      >
        <Sheet
          sx={{
            position: "relative",
            // bgcolor: "background.body",
            borderRadius: "sm",
            boxShadow: "lg",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            {forecast && (
              <>
                <Table
                  color="neutral"
                  variant="plain"
                  size="sm"
                  borderAxis="none"
                  sx={{
                    // Prevent acciodental text selection
                    userSelect: "none",
                    // Table width
                    width: "1000px",

                    // Table header
                    "& thead > tr *": {
                      bgcolor: "primary.softBg",
                      color: "primary.softColor",
                    },
                    "& thead > tr th:last-child": {
                      borderTopRightRadius: 0,
                    },

                    // Table cells (values)
                    "& td": { height: "24px" },

                    //First column (legend)
                    "& tr > *:first-child": {
                      width: "15%",
                      textAlign: "right",
                    },

                    // Second column (units)
                    "& thead th:nth-child(2)": {
                      width: "7%",
                    },

                    // All columns except (legend, units)
                    "& tr > *:not(:first-child):not(:nth-child(2))": {
                      textAlign: "center",
                      width: "6%",
                    },

                    "& tr > *:nth-child(2)": {
                      borderLeftStyle: "none",
                    },

                    "& tr > *:last-child": {
                      borderRightStyle: "solid",
                      borderWidth: "1px",
                      borderColor: "--TableCell-borderColor",
                    },

                    "& tbody tr:last-child > th:first-child": {
                      borderBottomLeftRadius: "var(--unstable_actionRadius)",
                    },

                    //tbody first column
                    "& tbody tr > *:first-child": {
                      bgcolor: "neutral.100",
                    },

                    //tbody second column
                    "& tbody tr > *:nth-child(2)": {
                      bgcolor: "neutral.100",
                    },

                    //tbody first row (weather)
                    "& tbody > tr:first-child": {
                      height: "64px",
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th></th>
                      <th></th>
                      {forecast.forecasts.map((data, index) => (
                        <th key={index}>
                          <Typography level="title-sm">
                            {format(data.date, "EEE d")}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th></th>
                      <th></th>
                      {forecast.forecasts.map((data, index) => (
                        <td key={index}>
                          {(() => {
                            switch (data.rainfall.description) {
                              case "NO RAIN":
                                switch (data.cloud_cover) {
                                  case "SUNNY":
                                    return <SunnyIcon />;
                                  case "PARTLY CLOUDY":
                                    return <NoRainParCloudyIcon />;
                                  case "MOSTLY CLOUDY":
                                    return <NoRainMosCloudyIcon />;
                                  case "CLOUDY":
                                    return <NoRainCloudyIcon />;
                                  default:
                                    return null;
                                }
                              case "LIGHT RAINS":
                                switch (data.cloud_cover) {
                                  case "SUNNY":
                                    return <LightRainsParCloudyIcon />;
                                  case "PARTLY CLOUDY":
                                    return <LightRainsParCloudyIcon />;
                                  case "MOSTLY CLOUDY":
                                    return <LightRainsMosCloudyIcon />;
                                  case "CLOUDY":
                                    return <LightRainsCloudyIcon />;
                                  default:
                                    return null;
                                }
                              case "MODERATE RAINS":
                                switch (data.cloud_cover) {
                                  case "SUNNY":
                                    return <ModRainsParCloudyIcon />;
                                  case "PARTLY CLOUDY":
                                    return <ModRainsParCloudyIcon />;
                                  case "MOSTLY CLOUDY":
                                    return <ModRainsMosCloudyIcon />;
                                  case "CLOUDY":
                                    return <ModRainsCloudyIcon />;
                                  default:
                                    return null;
                                }
                              case "HEAVY RAINS":
                                switch (data.cloud_cover) {
                                  case "SUNNY":
                                    return <HeavyRainsParCloudyIcon />;
                                  case "PARTLY CLOUDY":
                                    return <HeavyRainsParCloudyIcon />;
                                  case "MOSTLY CLOUDY":
                                    return <HeavyRainsMosCloudyIcon />;
                                  case "CLOUDY":
                                    return <HeavyRainsCloudyIcon />;
                                  default:
                                    return null;
                                }
                              default:
                                return null;
                            }
                          })()}
                        </td>
                      ))}
                    </tr>
                    <ForecastTable
                      forecast={forecast}
                      overlay={overlay}
                      setOverlay={setOverlay}
                      setIsMenuOpen={setIsMenuOpen}
                      temp={temp}
                      setTemp={setTemp}
                      setActiveTooltip={setActiveTooltip}
                    />
                    <tr>
                      <th>
                        <Typography level="title-sm">Wind direction</Typography>
                      </th>
                      <th>
                        {" "}
                        <Button
                          color="neutral"
                          onClick={function () {}}
                          size="sm"
                          variant="plain"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          desc
                        </Button>
                      </th>
                      {forecast.forecasts.map((data, index) => (
                        <td key={index}>
                          {(() => {
                            switch (data.wind.direction) {
                              case "N":
                                return <NIcon />;
                              case "NNE":
                                return <NNEIcon />;
                              case "NE":
                                return <NEIcon />; // Northeast
                              case "ENE":
                                return <ENEIcon />; // East-Northeast
                              case "E":
                                return <EIcon />; // East
                              case "ESE":
                                return <ESEIcon />; // East-Southeast
                              case "SE":
                                return <SEIcon />; // Southeast
                              case "SSE":
                                return <SSEIcon />; // South-Southeast
                              case "S":
                                return <SIcon />; // South
                              case "SSW":
                                return <SSWIcon />; // South-Southwest
                              case "SW":
                                return <SWIcon />; // Southwest
                              case "WSW":
                                return <WSWIcon />; // West-Southwest
                              case "W":
                                return <WIcon />; // West
                              case "WNW":
                                return <WNWIcon />; // West-Northwest
                              case "NW":
                                return <NWIcon />; // Northwest
                              case "NNW":
                                return <NNWIcon />; // North-Northwest
                              default:
                                return null;
                            }
                          })()}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </Table>
                <Box sx={{ p: 1, width: "15%", height: "100%" }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      justifyContent: "flex-end",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <IconButton
                      size="sm"
                      color="neutral"
                      variant="outlined"
                      aria-label="download"
                    >
                      <DownloadIcon color="neutral" />
                    </IconButton>
                    <IconButton
                      size="sm"
                      color="neutral"
                      variant="outlined"
                      aria-label="close"
                      onClick={() => {
                        markerLayer.current.clearLayers();
                        setOpen(false);
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                  {location && (
                    <Typography level="body-xs" sx={{ mb: 1 }}>
                      {"Lat: " +
                        location.latLng.lat.toFixed(2) +
                        " " +
                        "Long: " +
                        location.latLng.lng.toFixed(2)}
                    </Typography>
                  )}
                  <Typography level="h3">{forecast.municity}</Typography>
                  <Typography level="title-sm">{forecast.province}</Typography>
                </Box>
              </>
            )}
          </Stack>
        </Sheet>
      </Box>
    </Slide>
  );
};

export default ForecastContainer;
