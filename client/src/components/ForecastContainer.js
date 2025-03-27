import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { format } from "date-fns";

import { Slide } from "@mui/material";
import { Box, Stack, Sheet, Typography, IconButton, Table } from "@mui/joy";
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

import ForecastTable from "./ForecastTable";
import ToggleUnits from "./ToggleUnits";

const ForecastContainer = ({
  map,
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
  units,
  setUnits,
  date,
  setDate,
  isLocateUsed,
  setIsLocateUsed,
}) => {
  const [forecast, setForecast] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  // Handles column highlight
  const handleMouseEnter = (index) => {
    // Highlight columns only from 3rd to 12th (zero-indexed: 2 to 11)
    if (index >= 2 && index <= 11 && index + 1) {
      setHoveredColumn(index);
    }
  };

  const handleMouseLeave = () => {
    setHoveredColumn(null);
  };

  // Get today's date
  const today = format(new Date(), "yyyy-MM-dd");

  // Set active column on initial render
  useEffect(() => {
    if (forecast) {
      const currentColumnIndex = forecast.forecasts.findIndex(
        (data) => format(new Date(data.date), "yyyy-MM-dd") === today
      );

      if (currentColumnIndex !== -1) {
        setActiveColumn(currentColumnIndex + 3); // Offset for first 2 columns
      }
    }
  }, []);

  // Update active column based on the current date prop from the parent
  useEffect(() => {
    if (forecast && date) {
      const currentColumnIndex = forecast.forecasts.findIndex(
        (data) =>
          format(new Date(data.date), "yyyy-MM-dd") ===
          format(new Date(date), "yyyy-MM-dd")
      );

      if (currentColumnIndex !== -1) {
        setActiveColumn(currentColumnIndex + 3); // Offset for first 2 columns
      }
    }
  }, [forecast, date]);

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
          userSelect: "none",
        }}
      >
        <Sheet
          className="glass"
          sx={{
            position: "relative",
            borderRadius: "sm",
            boxShadow: "lg",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "min-content",
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
                    "--highlightColor": "#007FFF",
                    "--borderStyle": "3px solid var(--highlightColor)",
                    "--cellHeight": "40px",
                    "--hoverColor": "#EDF5FD",
                    "--hoverBorderStyle": "3px solid var(--hoverColor)",
                    "--transpBorderStyle": " 3px solid transparent",

                    backgroundColor: "common.white",
                    width: "1000px",
                    tableLayout: "fixed", // Prevent resizing

                    // ✅ Table header styles
                    "& thead > tr > th": {
                      bgcolor: "primary.softBg",
                    },

                    "& thead > tr *": {
                      color: "primary.softColor",
                    },

                    // ✅ Table header styles
                    "& tbody > tr > td": {
                      bgcolor: "common.white",
                    },

                    "& thead > tr th:last-child": {
                      borderTopRightRadius: 0,
                    },

                    // ✅ Cell height and column text alignment
                    "& td, & th": {
                      height: "var(--cellHeight)",
                      alignContent: "center",
                      boxSizing: "border-box",
                    },
                    "& tr > *:first-child": {
                      width: "15%",
                      textAlign: "right",
                    },
                    "& thead th:nth-child(2)": { width: "7%" },
                    "& tr > *:not(:first-child):not(:nth-child(2))": {
                      textAlign: "center",
                      width: "6%",
                    },
                    "& tr > *:nth-child(2)": { borderLeftStyle: "none" },
                    "& tr > *:last-child": {
                      borderRightStyle: "solid",
                      borderRightWidth: "1px",
                      borderColor: "--TableCell-borderColor",
                    },

                    "& tbody tr:last-child > th:first-child": {
                      borderBottomLeftRadius: "var(--unstable_actionRadius)",
                    },
                    "& tbody tr > *:first-child, & tbody tr > *:nth-child(2)": {
                      bgcolor: "neutral.100",
                    },
                    "& tbody > tr:first-child": {
                      height: "64px",
                    },

                    "& thead tr > th": {
                      borderTop: "var(--transpBorderStyle)",
                    },
                    "& tbody tr:last-child > td": {
                      borderBottom: "var(--transpBorderStyle)",
                    },
                    // ✅ Highlight the active column (date match or user-clicked column)
                    ...(activeColumn !== null && {
                      // Header (top, left, right borders)
                      [`& thead tr > *:nth-child(${activeColumn})`]: {
                        borderTop: "var(--borderStyle)",
                        borderLeft: "var(--borderStyle)",
                        borderRight: "var(--borderStyle)",
                        bgcolor:
                          hoveredColumn === activeColumn - 1
                            ? "primary.300" // Apply hover bg if active and hovered
                            : "primary.100", // Active background otherwise
                      },
                      // Middle rows (left, right borders)
                      [`& tbody tr:not(:last-child) > *:nth-child(${activeColumn})`]:
                        {
                          borderLeft: "var(--borderStyle)",
                          borderRight: "var(--borderStyle)",
                          bgcolor:
                            hoveredColumn === activeColumn - 1
                              ? "primary.softHoverBg" // Apply hover bg
                              : "none", // Active background otherwise
                        },
                      // Last row (left, right, bottom borders)
                      [`& tbody tr:last-child > *:nth-child(${activeColumn})`]:
                        {
                          borderLeft: "var(--borderStyle)",
                          borderRight: "var(--borderStyle)",
                          borderBottom: "var(--borderStyle)",
                          bgcolor:
                            hoveredColumn === activeColumn - 1
                              ? "primary.softHoverBg" // Apply hover bg
                              : "none", // Active background otherwise
                        },
                    }),

                    // Highlight column with borders on hover
                    ...(hoveredColumn !== null && {
                      // Highlight header (top border, left, right)
                      [`& thead tr > *:nth-child(${hoveredColumn + 1})`]: {
                        bgcolor: "primary.300",
                        borderTop:
                          hoveredColumn === activeColumn - 1
                            ? "var(--borderStyle)"
                            : "var(--transpBorderStyle)", // Add border if hovered column matches active column
                        borderLeft:
                          hoveredColumn === activeColumn - 1
                            ? "var(--borderStyle)"
                            : "none",
                        borderRight:
                          hoveredColumn === activeColumn - 1
                            ? "var(--borderStyle)"
                            : "none",
                      },
                      // Highlight middle rows (left, right)
                      [`& tbody tr:not(:last-child) > *:nth-child(${
                        hoveredColumn + 1
                      })`]: {
                        bgcolor: "primary.softHoverBg",
                        borderLeft:
                          hoveredColumn === activeColumn - 1
                            ? "var(--borderStyle)"
                            : "none", // Add border if hovered column matches active column
                        borderRight:
                          hoveredColumn === activeColumn - 1
                            ? "var(--borderStyle)"
                            : "none",
                      },
                      // Highlight last row (left, right, bottom)
                      [`& tbody tr:last-child > *:nth-child(${
                        hoveredColumn + 1
                      })`]: {
                        bgcolor: "primary.softHoverBg",
                        borderBottom:
                          hoveredColumn === activeColumn - 1
                            ? "var(--borderStyle)"
                            : "var(--transpBorderStyle)", // Add border if hovered column matches active column

                        borderLeft:
                          hoveredColumn === activeColumn - 1
                            ? "var(--borderStyle)"
                            : "none",
                        borderRight:
                          hoveredColumn === activeColumn - 1
                            ? "var(--borderStyle)"
                            : "none",
                      },
                    }),
                  }}
                >
                  <thead>
                    <tr>
                      <th></th>
                      <th></th>
                      {forecast.forecasts.map((data, index) => (
                        <th
                          key={index}
                          onMouseEnter={() => handleMouseEnter(index + 2)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => {
                            setActiveColumn(index + 3); // Adjust for first 2 columns
                            setDate(data.date); // ✅ Set the date using setDate
                          }}
                        >
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
                        <td
                          key={index}
                          onMouseEnter={() => handleMouseEnter(index + 2)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => {
                            setActiveColumn(index + 3); // Adjust for first 2 columns
                            setDate(data.date); // ✅ Set the date using setDate
                          }}
                        >
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
                      units={units}
                      setUnits={setUnits}
                      setActiveColumn={setActiveColumn}
                      setDate={setDate}
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                      hoveredColumn={hoveredColumn}
                    />
                    <tr>
                      <th>
                        <Typography level="title-sm">Wind direction</Typography>
                      </th>
                      <th>
                        <ToggleUnits
                          color="neutral"
                          size="sm"
                          variant="plain"
                          sx={{ fontSize: "0.8rem", minHeight: 0 }}
                          context="container"
                          overlay="wind_direction"
                          units={units}
                          setUnits={setUnits}
                        />
                      </th>
                      {forecast.forecasts.map((data, index) => (
                        <td
                          key={index}
                          onMouseEnter={() => handleMouseEnter(index + 2)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => {
                            setActiveColumn(index + 3); // Adjust for first 2 columns
                            setDate(data.date); // ✅ Set the date using setDate
                          }}
                        >
                          {units.windDirection === "arrow"
                            ? (() => {
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
                              })()
                            : data.wind.direction}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </Table>
                <Box sx={{ p: 1, width: "20%", height: "100%" }}>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{
                      justifyContent: "flex-end",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <IconButton
                      size="sm"
                      color="inherit"
                      variant="outlined"
                      aria-label="download"
                    >
                      <DownloadIcon
                        sx={{
                          color: "var(--joy-palette-neutral-700, #32383E)",
                        }}
                      />
                    </IconButton>
                    <IconButton
                      size="sm"
                      color="inherit"
                      variant="outlined"
                      aria-label="close"
                      onClick={() => {
                        isLocateUsed
                          ? markerLayer.current.clearLayers()
                          : markerLayer.current.eachLayer((layer) => {
                              if (layer.getLatLng().equals(location.latLng)) {
                                layer.openPopup();
                              }
                            });
                        setIsLocateUsed(false);
                        setOpen(false);
                      }}
                    >
                      <CloseIcon
                        sx={{
                          color: "var(--joy-palette-neutral-700, #32383E)",
                        }}
                      />
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
