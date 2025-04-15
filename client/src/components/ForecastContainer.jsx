import React, { useState, useEffect, Fragment } from "react";
import axios from "axios";
import { format } from "date-fns";

import { Slide } from "@mui/material";
import {
  Box,
  Stack,
  Sheet,
  Typography,
  IconButton,
  Table,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  FormControl,
  FormLabel,
  Button,
  Radio,
  ToggleButtonGroup,
  Select,
  Option,
  Chip,
  Switch,
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

import ForecastTable from "./ForecastTable";
import ToggleUnits from "./ToggleUnits";
import ForecastDownload from "./ForecastDownload";

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
  isDiscrete,
}) => {
  const [forecast, setForecast] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [todayColumn, setTodayColumn] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [openDownload, setOpenDownload] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState("current");
  const [docUnits, setDocUnits] = useState(units);
  const [docFormat, setDocFormat] = useState("pdf");
  const [docColored, setDocColored] = useState(true);

  useEffect(() => {
    setDocUnits(units);
  }, [units]);

  const handleChange = (event, value) => {
    setDocFormat(value);
  };

  const handleUnitChange = (event, value) => {
    setSelectedUnits(event.target.value);
  };

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

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [setOpen]);

  // Set active column on initial render
  useEffect(() => {
    if (forecast) {
      const currentColumnIndex = forecast?.forecasts.findIndex(
        (data) => format(new Date(data.date), "yyyy-MM-dd") === today
      );

      if (currentColumnIndex !== -1) {
        setActiveColumn(currentColumnIndex + 3); // Offset for first 2 columns
        setTodayColumn(currentColumnIndex + 3);
      }
    }
  }, [activeColumn]);

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
    if (!open && location.municity) return;

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
                    // Custom CSS variables for styling
                    "--highlightColor": "#007FFF", // Highlight color for active cells
                    "--borderStyle": "3px solid var(--highlightColor)", // Border style for active cells
                    "--cellHeight": "20px", // Height for each cell
                    "--hoverColor": "#EDF5FD", // Hover color for cells
                    "--hoverBorderStyle": "3px solid var(--hoverColor)", // Border style for hovered cells
                    "--transpBorderStyle": "3px solid transparent", // Transparent border style for cells

                    // General table styling
                    backgroundColor: "common.white", // Background color for the table
                    width: "1000px", // Width of the table
                    tableLayout: "fixed", // Prevent resizing of the table

                    // Table header styles
                    "& thead > tr > th": {
                      bgcolor: "primary.softBg", // Background color for table headers
                    },

                    "& thead > tr p": {
                      color: "primary.softColor", // Text color for table headers
                    },

                    // Table body styles
                    "& tbody > tr > td": {
                      bgcolor: "common.white", // Background color for table body cells
                    },

                    "& thead > tr th:last-child": {
                      borderTopRightRadius: 0, // Remove top-right corner radius for the last header cell
                    },

                    // Cell height and column text alignment
                    "& td, & th": {
                      height: "var(--cellHeight)", // Apply custom cell height
                      alignContent: "center", // Align content in the center
                      boxSizing: "border-box", // Include padding and border in the element's width and height
                    },
                    "& tr > *:first-child": {
                      width: "15%", // Width for the first column
                      textAlign: "right", // Align text to the right for the first column
                    },
                    "& thead th:nth-child(2)": { width: "7%" }, // Width for the second column header
                    "& tr > *:not(:first-child):not(:nth-child(2))": {
                      textAlign: "center", // Align text to the center for all columns except the first and second
                      width: "6%", // Width for all columns except the first and second
                    },
                    "& tr > *:nth-child(2)": { borderLeftStyle: "none" }, // Remove left border for the second column

                    "& tbody tr:last-child > th:first-child": {
                      borderBottomLeftRadius: "var(--unstable_actionRadius)", // Bottom-left corner radius for the last cell in the first column
                    },
                    "& tbody tr > *:first-child, & tbody tr > *:nth-child(2)": {
                      bgcolor: "neutral.100", // Background color for the first and second columns in the body
                    },
                    "& tbody > tr:first-child": {
                      height: "64px", // Height for the first row in the body
                    },

                    "& thead tr > th": {
                      borderTop: "var(--transpBorderStyle)", // Transparent border on top for table headers
                    },
                    "& tbody tr:last-child > td": {
                      borderBottom: "var(--transpBorderStyle)", // Transparent border on bottom for the last row in the body
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
                          {todayColumn === index + 2 ? (
                            <Chip
                              color="primary"
                              size="sm"
                              variant="plain"
                              className="today-chip"
                              sx={{
                                position: "absolute",
                                transform: "translate(-90px, -32px)",
                                fontWeight: "bold",
                                backgroundColor: "primary.100",
                                color: "primary.700",
                              }}
                            >
                              TODAY
                            </Chip>
                          ) : null}
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
                      isDiscrete={isDiscrete}
                    />
                    <tr>
                      <th>
                        <Typography>Wind direction</Typography>
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
                          style={{ minHeight: "28px" }}
                        >
                          {units.windDirection === "arrow" ? (
                            (() => {
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
                          ) : (
                            <Typography sx={{ my: 0.65 }}>
                              {data.wind.direction}
                            </Typography>
                          )}
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
                    <Fragment>
                      <IconButton
                        size="sm"
                        color="inherit"
                        variant="outlined"
                        aria-label="download"
                        onClick={() => setOpenDownload(true)}
                      >
                        <DownloadIcon
                          sx={{
                            color: "var(--joy-palette-neutral-700, #32383E)",
                          }}
                        />
                      </IconButton>
                      <Modal
                        open={openDownload}
                        onClose={() => setOpenDownload(false)}
                      >
                        <ModalDialog sx={{ "--ModalDialog-minWidth": "400px" }}>
                          <DialogTitle>
                            {"Download forecast for"}
                            <Typography
                              level="title-lg"
                              sx={{
                                fontWeight: "bold",
                              }}
                            >
                              {location.municity}
                            </Typography>
                          </DialogTitle>
                          <DialogContent>
                            Select your preferences:
                          </DialogContent>

                          <Stack spacing={3}>
                            <FormControl size="md">
                              <FormLabel>Set units</FormLabel>
                              <Stack
                                direction="row"
                                spacing={2}
                                sx={{
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                }}
                              >
                                <Radio
                                  checked={selectedUnits === "current"}
                                  onChange={handleUnitChange}
                                  value="current"
                                  name="radio-buttons"
                                  slotProps={{
                                    input: { "aria-label": "current" },
                                  }}
                                  label="Current"
                                  size="sm"
                                />
                                <Radio
                                  checked={selectedUnits === "custom"}
                                  onChange={handleUnitChange}
                                  value="custom"
                                  name="radio-buttons"
                                  slotProps={{
                                    input: { "aria-label": "custom" },
                                  }}
                                  label="Custom"
                                  size="sm"
                                />
                              </Stack>
                              {selectedUnits === "custom" ? (
                                <Box
                                  sx={{
                                    p: 1,
                                    mt: 1,
                                    backgroundColor: "neutral.100",
                                  }}
                                >
                                  <FormControl
                                    size="sm"
                                    orientation="horizontal"
                                  >
                                    <FormLabel sx={{ flexGrow: 1 }}>
                                      Temperature
                                    </FormLabel>
                                    <ToggleButtonGroup
                                      size="sm"
                                      variant="plain"
                                      value={docUnits.temperature}
                                      exclusive
                                      onChange={(e, value) =>
                                        value &&
                                        setDocUnits({
                                          ...docUnits,
                                          temperature: value,
                                        })
                                      }
                                    >
                                      <Button value="°C">
                                        <Typography level="body-xs">
                                          °C
                                        </Typography>
                                      </Button>
                                      <Button value="°F">
                                        <Typography level="body-xs">
                                          °F
                                        </Typography>
                                      </Button>
                                    </ToggleButtonGroup>
                                  </FormControl>

                                  <FormControl
                                    size="sm"
                                    orientation="horizontal"
                                    sx={{ mt: 2 }}
                                  >
                                    <Box
                                      sx={{ display: "flex", flex: 1, pr: 1 }}
                                    >
                                      <FormLabel>Rainfall</FormLabel>
                                    </Box>
                                    <ToggleButtonGroup
                                      size="sm"
                                      variant="plain"
                                      value={docUnits.rainfall}
                                      exclusive
                                      onChange={(e, value) =>
                                        value &&
                                        setDocUnits({
                                          ...docUnits,
                                          rainfall: value,
                                        })
                                      }
                                    >
                                      <Button value="mm/24h">
                                        <Typography level="body-xs">
                                          mm/24h
                                        </Typography>
                                      </Button>
                                      <Button value="in/24h">
                                        <Typography level="body-xs">
                                          in/24h
                                        </Typography>
                                      </Button>
                                    </ToggleButtonGroup>
                                  </FormControl>

                                  <FormControl
                                    size="sm"
                                    orientation="horizontal"
                                    sx={{ mt: 2 }}
                                  >
                                    <Box
                                      sx={{ display: "flex", flex: 1, pr: 1 }}
                                    >
                                      <FormLabel>Wind speed</FormLabel>
                                    </Box>
                                    <ToggleButtonGroup
                                      size="sm"
                                      variant="plain"
                                      value={docUnits.windSpeed}
                                      exclusive
                                      onChange={(e, value) =>
                                        value &&
                                        setDocUnits({
                                          ...docUnits,
                                          windSpeed: value,
                                        })
                                      }
                                    >
                                      <Button value="m/s">
                                        <Typography level="body-xs">
                                          m/s
                                        </Typography>
                                      </Button>
                                      <Button value="km/h">
                                        <Typography level="body-xs">
                                          km/h
                                        </Typography>
                                      </Button>
                                      <Button value="kt">
                                        <Typography level="body-xs">
                                          knot
                                        </Typography>
                                      </Button>
                                    </ToggleButtonGroup>
                                  </FormControl>

                                  {docUnits === "pdf" ? (
                                    <FormControl
                                      size="sm"
                                      orientation="horizontal"
                                      sx={{ mt: 2 }}
                                    >
                                      <Box
                                        sx={{ display: "flex", flex: 1, pr: 1 }}
                                      >
                                        <FormLabel>Wind direction</FormLabel>
                                      </Box>
                                      <ToggleButtonGroup
                                        size="sm"
                                        variant="plain"
                                        value={docUnits.windDirection}
                                        exclusive
                                        onChange={(e, value) =>
                                          value &&
                                          setDocUnits({
                                            ...docUnits,
                                            windDirection: value,
                                          })
                                        }
                                      >
                                        <Button value="arrow">
                                          <Typography level="body-xs">
                                            arrow
                                          </Typography>
                                        </Button>
                                        <Button value="desc">
                                          <Typography level="body-xs">
                                            description
                                          </Typography>
                                        </Button>
                                      </ToggleButtonGroup>
                                    </FormControl>
                                  ) : null}
                                </Box>
                              ) : null}
                            </FormControl>

                            {docFormat === "pdf" && (
                              <FormControl orientation="horizontal">
                                <FormLabel>
                                  Show colors for visualization
                                </FormLabel>
                                <Switch
                                  size="sm"
                                  checked={docColored}
                                  onChange={(event) =>
                                    setDocColored(event.target.checked)
                                  }
                                  variant={docColored ? "solid" : "outlined"}
                                  endDecorator={docColored ? "On" : "Off"}
                                  slotProps={{
                                    endDecorator: {
                                      sx: {
                                        minWidth: 24,
                                      },
                                    },
                                  }}
                                />
                              </FormControl>
                            )}

                            <FormControl>
                              <FormLabel>File format</FormLabel>
                              <Select
                                defaultValue="pdf"
                                onChange={handleChange}
                              >
                                <Option value="pdf">PDF</Option>
                                <Option value="csv">CSV</Option>
                                <Option value="txt">TXT</Option>
                              </Select>
                            </FormControl>

                            <ForecastDownload
                              location={location}
                              forecast={forecast}
                              docFormat={docFormat}
                              docUnits={docUnits}
                              docColored={docColored}
                            />
                          </Stack>
                        </ModalDialog>
                      </Modal>
                    </Fragment>
                    <IconButton
                      size="sm"
                      color="inherit"
                      variant="outlined"
                      aria-label="close"
                      onClick={() => {
                        markerLayer.current.eachLayer((layer) => {
                          if (layer.getLatLng().equals(location.latLng)) {
                            layer.openPopup();
                          }
                        });

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

                  <Typography level="body-xs" sx={{ mb: 1 }}>
                    {"Lat: " +
                      location.latLng.lat.toFixed(4) +
                      " " +
                      "Long: " +
                      location.latLng.lng.toFixed(4)}
                  </Typography>

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
