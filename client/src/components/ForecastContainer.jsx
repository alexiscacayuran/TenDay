import React, { useState, useEffect, Fragment, useRef } from "react";
import { useTheme } from "@mui/joy/styles";
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
  LightRainsSunnyIcon,
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
  NoResultImage,
} from "./CustomIcons";
import NoResult from "../assets/images/no-result.png";

import ForecastTable from "./ForecastTable";
import ToggleUnits from "./ToggleUnits";
import ForecastDownload from "./ForecastDownload";
import MunicitySelector from "./MunicitySelector";
import MunicitiesSelector from "./MunicitiesSelector";

const ForecastContainer = ({
  map,
  open,
  setOpen,
  location,
  setLocation,
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
  serverToken,
  arcgisToken,
  selectedPolygon,
}) => {
  const isInitial = useRef(true);
  const [forecast, setForecast] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [todayColumn, setTodayColumn] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [openDownload, setOpenDownload] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState("current");
  const [docUnits, setDocUnits] = useState(units);
  const [docFormat, setDocFormat] = useState("pdf");
  const [docColored, setDocColored] = useState(true);
  const [docExtendForecast, setDocExtendForecast] = useState(false);
  const [selectedMunicities, setSelectedMunicities] = useState([]);

  const theme = useTheme();

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
        //setActiveColumn(currentColumnIndex + 3); // Offset for first 2 columns
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
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }

    if (!open && location.municity === "" && location.province === "") {
      setForecast(null);
    } else {
      const fetchFullForecast = async () => {
        try {
          const response = await axios.get("/fullInternal", {
            params: {
              municity: location.municity,
              province: location.province,
            },
            headers: {
              token: serverToken,
            },
          });

          setForecast(response.data);
        } catch (error) {
          console.error(error);
          setForecast(null);
        }
      };
      fetchFullForecast();
    }
  }, [open, location]);

  const renderWeatherIcon = (data) => {
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
            return <LightRainsSunnyIcon />;
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
  };

  const renderWindIcon = (data) => {
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
  };

  const config = {
    "--highlightColor": "#007FFF",
    "--borderStyle": "3px solid var(--highlightColor)",
    "--cellHeight": "20px",
    "--hoverColor": "#EDF5FD",
    "--hoverBorderStyle": "3px solid var(--hoverColor)",
    "--transpBorderStyle": "3px solid transparent",

    backgroundColor: "common.white",
    width: "900px",
    maxWidth: "900px",

    tableLayout: "fixed",

    "& thead > tr > th": {
      bgcolor: "primary.softBg",
    },

    "& thead > tr p": {
      color: "primary.softColor",
    },

    "& tbody > tr > td": {
      bgcolor: "common.white",
    },

    "& thead > tr th:last-of-type": {
      borderTopRightRadius: 0,
    },

    "& td, & th": {
      height: "var(--cellHeight)",
      boxSizing: "border-box",
    },

    "& th:first-of-type": {
      width: "13%",
      textAlign: "right",
    },
    "& th:nth-of-type(2)": { width: "7%" },

    "& thead th:nth-of-type(n+3)": {
      textAlign: "center",
      width: "6%",
    },
    "& td:nth-of-type(n+1)": {
      textAlign: "center",
      width: "6%",
    },

    "& tbody tr:last-of-type > th:first-of-type": {
      borderBottomLeftRadius: "var(--unstable_actionRadius)",
    },

    "& tbody tr > th:first-of-type, & tbody tr > th:nth-of-type(2)": {
      bgcolor: "neutral.100",
    },

    "& tbody > tr:first-of-type": {
      height: "50px",
    },

    "& thead tr > th": {
      borderTop: "var(--transpBorderStyle)",
    },
    "& tbody tr:last-of-type > td": {
      borderBottom: "var(--transpBorderStyle)",
    },

    ...(activeColumn !== null && {
      [`& thead tr > th:nth-of-type(${activeColumn})`]: {
        borderTop: "var(--borderStyle)",
        borderLeft: "var(--borderStyle)",
        borderRight: "var(--borderStyle)",
        bgcolor:
          hoveredColumn === activeColumn - 1 ? "primary.300" : "primary.100",
      },
      [`& tbody tr:not(:last-of-type) > td:nth-of-type(${activeColumn - 2})`]: {
        borderLeft: "var(--borderStyle)",
        borderRight: "var(--borderStyle)",
        bgcolor:
          hoveredColumn === activeColumn - 1 ? "primary.softHoverBg" : "none",
      },
      [`& tbody tr:last-of-type > td:nth-of-type(${activeColumn - 2})`]: {
        borderLeft: "var(--borderStyle)",
        borderRight: "var(--borderStyle)",
        borderBottom: "var(--borderStyle)",
        bgcolor:
          hoveredColumn === activeColumn - 1 ? "primary.softHoverBg" : "none",
      },
    }),

    ...(hoveredColumn !== null && {
      [`& thead tr > th:nth-of-type(${hoveredColumn + 1})`]: {
        bgcolor: "primary.300",
        borderTop:
          hoveredColumn === activeColumn - 1
            ? "var(--borderStyle)"
            : "var(--transpBorderStyle)",
        borderLeft:
          hoveredColumn === activeColumn - 1 ? "var(--borderStyle)" : "none",
        borderRight:
          hoveredColumn === activeColumn - 1 ? "var(--borderStyle)" : "none",
      },
      [`& tbody tr:not(:last-of-type) > td:nth-of-type(${hoveredColumn - 1})`]:
        {
          bgcolor: "primary.softHoverBg",
          borderLeft:
            hoveredColumn === activeColumn - 1 ? "var(--borderStyle)" : "none",
          borderRight:
            hoveredColumn === activeColumn - 1 ? "var(--borderStyle)" : "none",
        },
      [`& tbody tr:last-of-type > td:nth-of-type(${hoveredColumn - 1})`]: {
        bgcolor: "primary.softHoverBg",
        borderBottom:
          hoveredColumn === activeColumn - 1
            ? "var(--borderStyle)"
            : "var(--transpBorderStyle)",
        borderLeft:
          hoveredColumn === activeColumn - 1 ? "var(--borderStyle)" : "none",
        borderRight:
          hoveredColumn === activeColumn - 1 ? "var(--borderStyle)" : "none",
      },
    }),
  };

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          userSelect: "none",
          pointerEvents: "auto",
          position: "absolute",
          width: "100%",
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
            {forecast ? (
              <>
                <Table
                  color="neutral"
                  variant="plain"
                  size="sm"
                  borderAxis="none"
                  sx={config}
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
                                transform: "translate(-92px, -30px)",
                                fontWeight: "bold",
                                backgroundColor:
                                  hoveredColumn === index + 1
                                    ? "primary.300"
                                    : "primary.100",
                                color: "primary.700",
                                padding: "0 10px",
                                fontSize: "0.85em",
                              }}
                            >
                              TODAY
                            </Chip>
                          ) : // <Box
                          //   className="rounded-tab"
                          //   sx={{
                          //     position: "absolute",
                          //     transform: "translate(-100px, -30px)",
                          //   }}
                          // >
                          //   TODAY
                          // </Box>
                          null}
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
                          {renderWeatherIcon(data)}
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
                            renderWindIcon(data)
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
                <Box
                  sx={{
                    p: 1,
                    width: "max-content",
                    minWidth: "220px",
                    maxWidth: "220px",
                    height: "100%",
                  }}
                >
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
                        <ModalDialog
                          sx={{
                            width: "450px",
                            "--ModalDialog-maxWidth": "450px",
                          }}
                        >
                          <DialogTitle sx={{ mb: 2 }}>
                            Download forecast for
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
                                      <Button value="mm/day">
                                        <Typography level="body-xs">
                                          mm/day
                                        </Typography>
                                      </Button>
                                      <Button value="in/day">
                                        <Typography level="body-xs">
                                          in/day
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
                              <>
                                <FormControl orientation="horizontal">
                                  <FormLabel sx={{ mr: "auto" }}>
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
                                          fontWeight: 400,
                                        },
                                      },
                                    }}
                                  />
                                </FormControl>
                              </>
                            )}

                            <FormControl
                              orientation="horizontal"
                              sx={{ flexWrap: "wrap" }}
                            >
                              <FormLabel sx={{ flexGrow: 1 }}>
                                Add other forecast data
                              </FormLabel>
                              <Switch
                                sx={{ flexGrow: 0 }}
                                size="sm"
                                checked={docExtendForecast}
                                onChange={(event) => {
                                  setDocExtendForecast(event.target.checked);
                                }}
                                variant={
                                  docExtendForecast ? "solid" : "outlined"
                                }
                                endDecorator={docExtendForecast ? "Yes" : "No"}
                                slotProps={{
                                  endDecorator: {
                                    sx: {
                                      minWidth: 24,
                                      fontWeight: 400,
                                    },
                                  },
                                }}
                              />
                              {docExtendForecast && (
                                <MunicitiesSelector
                                  forecast={forecast}
                                  serverToken={serverToken}
                                  selectedMunicities={selectedMunicities}
                                  setSelectedMunicities={setSelectedMunicities}
                                  setDocExtendForecast={setDocExtendForecast}
                                />
                              )}
                            </FormControl>

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
                              serverToken={serverToken}
                              location={location}
                              forecast={forecast}
                              docFormat={docFormat}
                              docUnits={docUnits}
                              docColored={docColored}
                              docExtendForecast={docExtendForecast}
                              selectedMunicities={selectedMunicities}
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

                  <Box sx={{ pr: 1 }}>
                    <Typography level="body-xs" sx={{ mb: 2 }}>
                      {"LAT " +
                        location.latLng.lat.toFixed(4) +
                        "  " +
                        "LONG " +
                        location.latLng.lng.toFixed(4)}
                    </Typography>

                    <MunicitySelector
                      map={map}
                      arcgisToken={arcgisToken}
                      serverToken={serverToken}
                      forecast={forecast}
                      setLocation={setLocation}
                      selectedPolygon={selectedPolygon}
                    />
                    <Typography level="title-sm">
                      {forecast.province}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: "1128px",
                    height: "260px",
                    bgcolor: "common.white",
                    borderRadius: "sm",
                    p: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0}
                    sx={{
                      justifyContent: "flex-end",
                      alignItems: "flex-start",
                    }}
                  >
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

                  <Stack
                    sx={{
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-start",
                        position: "relative",
                        bottom: 30,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={4}
                        sx={{
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <NoResultImage />
                        <Stack
                          direction="column"
                          spacing={2}
                          sx={{
                            justifyContent: "center",
                            alignItems: "flex-start",
                            width: "40%",
                          }}
                        >
                          <Typography level="h3" component="div">
                            Oops, sorry...
                          </Typography>
                          <Typography level="body-sm" component="div">
                            No municipal level forecast available. If you
                            believe this is a mistake, please submit a report.
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              alignSelf: "flex-end",
                            }}
                          >
                            <Button
                              color="neutral"
                              onClick={() => {
                                markerLayer.current.eachLayer((layer) => {
                                  layer.remove();
                                });

                                markerLayer.current = null;

                                if (selectedPolygon.current) {
                                  map.removeLayer(selectedPolygon.current);
                                  selectedPolygon.current = null;
                                }
                                setOpen(false);
                              }}
                              variant="plain"
                            >
                              Close
                            </Button>
                            <Button
                              color="neutral"
                              onClick={function () {}}
                              variant="soft"
                            >
                              Report
                            </Button>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
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
