import React, { useState, useEffect, Fragment, useRef } from "react";
// import { useTheme } from "@mui/joy/styles";
import axios from "axios";
import { format } from "date-fns";
import { CssVarsProvider } from "@mui/joy/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import theme from "../theme";
import { Slide, Fade } from "@mui/material";
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

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const isClickValid = useRef(true);
  const isTableCollapsed = useMediaQuery("(max-width:1295px)");
  const [shadowLeft, setShadowLeft] = useState(false);
  const [shadowRight, setShadowRight] = useState(isTableCollapsed);
  const isBelowLaptop = useMediaQuery(theme.breakpoints.down("lg"));

  useEffect(() => {
    setShadowLeft(false);
  }, [isBelowLaptop]);

  const updateShadows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    console.dir(el);
    setShadowLeft(isBelowLaptop && scrollLeft > 150);
    setShadowRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleHorizontalWheelScroll = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
        updateShadows(); // NEW: update shadow state
      }
    };

    container.addEventListener("scroll", updateShadows);
    container.addEventListener("wheel", handleHorizontalWheelScroll, {
      passive: false,
    });

    updateShadows(); // Initial update on mount

    return () =>
      container.removeEventListener("wheel", handleHorizontalWheelScroll);
  }, []);

  // Drag handlers
  const onDragStart = (e) => {
    setIsDragging(true);
    isClickValid.current = true;
    dragStartX.current = e.clientX;
    scrollStartX.current = scrollRef.current.scrollLeft;
  };

  const onDragMove = (e) => {
    if (!isDragging) return;
    const dx = dragStartX.current - e.clientX;
    if (Math.abs(dx) > 5) isClickValid.current = false;
    scrollRef.current.scrollLeft = scrollStartX.current + dx;

    updateShadows(); // NEW: update on drag
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  const onDragLeave = () => {
    if (isDragging) setIsDragging(false);
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
    tableLayout: "fixed",
    width: "100%",
    "& thead > tr > th": {
      bgcolor: "primary.softBg",
    },

    "& thead > tr p": {
      color: "primary.softColor",
    },

    "& tbody > tr > td": {
      bgcolor: "common.white",
    },

    "& td, & th": {
      height: "var(--TableCell-height)",
      boxSizing: "border-box",
      padding: "2px",
    },

    // first header column
    "& th:nth-of-type(1)": {
      // position: "sticky",
      left: 0,
      width: "var(--Table-firstColumnWidth)",
      flexShrink: 1,
      textAlign: "right",
    },

    // second header column
    "& th:nth-of-type(2)": {
      position: "sticky",
      width: "var(--Table-secondColumnWidth)",
      left: 0,
      textAlign: "left",
    },

    // body column width
    "& th:nth-of-type(n+3)": {
      width: "var(--Table-bodyColumnWidth)",
    },

    //body column alignment
    "& thead th:nth-of-type(n+3), & td:nth-of-type(n+1)": {
      textAlign: "center",
      cursor: "pointer",
    },

    "& tbody tr > th:first-of-type, & tbody tr > th:nth-of-type(2)": {
      bgcolor: "neutral.100",
    },

    "& tbody > tr:first-of-type": {
      height: "50px",
    },

    // table border adjustments
    "& thead tr:first-of-type > td:first-of-type": {
      borderTopLeftRadius: "6px",
    },

    "& tbody tr:last-of-type > th:first-of-type": {
      borderBottomLeftRadius: "var(--unstable_actionRadius)",
    },

    "& thead > tr th:last-of-type": {
      borderTopRightRadius: 0,
    },

    "& thead tr > th": {
      borderTop: "var(--TableColumn-transp)",
    },
    "& tbody tr:last-of-type > td": {
      borderBottom: "var(--TableColumn-transp)",
    },

    ...(activeColumn !== null && {
      [`& thead tr > th:nth-of-type(${activeColumn})`]: {
        borderTop: "var(--TableColumn-activeBorder)",
        borderLeft: "var(--TableColumn-activeBorder)",
        borderRight: "var(--TableColumn-activeBorder)",
        bgcolor:
          hoveredColumn === activeColumn - 1 ? "primary.300" : "primary.100",
      },
      [`& tbody tr:not(:last-of-type) > td:nth-of-type(${activeColumn - 2})`]: {
        borderLeft: "var(--TableColumn-activeBorder)",
        borderRight: "var(--TableColumn-activeBorder)",
        bgcolor:
          hoveredColumn === activeColumn - 1 ? "primary.softHoverBg" : "none",
      },
      [`& tbody tr:last-of-type > td:nth-of-type(${activeColumn - 2})`]: {
        borderLeft: "var(--TableColumn-activeBorder)",
        borderRight: "var(--TableColumn-activeBorder)",
        borderBottom: "var(--TableColumn-activeBorder)",
        bgcolor:
          hoveredColumn === activeColumn - 1 ? "primary.softHoverBg" : "none",
      },
    }),

    ...(hoveredColumn !== null && {
      [`& thead tr > th:nth-of-type(${hoveredColumn + 1})`]: {
        bgcolor: "primary.300",
        borderTop:
          hoveredColumn === activeColumn - 1
            ? "var(--TableColumn-activeBorder)"
            : "var(--TableColumn-transp)",
        borderLeft:
          hoveredColumn === activeColumn - 1
            ? "var(--TableColumn-activeBorder)"
            : "none",
        borderRight:
          hoveredColumn === activeColumn - 1
            ? "var(--TableColumn-activeBorder)"
            : "none",
      },
      [`& tbody tr:not(:last-of-type) > td:nth-of-type(${hoveredColumn - 1})`]:
        {
          bgcolor: "primary.softHoverBg",
          borderLeft:
            hoveredColumn === activeColumn - 1
              ? "var(--TableColumn-activeBorder)"
              : "none",
          borderRight:
            hoveredColumn === activeColumn - 1
              ? "var(--TableColumn-activeBorder)"
              : "none",
        },
      [`& tbody tr:last-of-type > td:nth-of-type(${hoveredColumn - 1})`]: {
        bgcolor: "primary.softHoverBg",
        borderBottom:
          hoveredColumn === activeColumn - 1
            ? "var(--TableColumn-activeBorder)"
            : "var(--TableColumn-transp)",
        borderLeft:
          hoveredColumn === activeColumn - 1
            ? "var(--TableColumn-activeBorder)"
            : "none",
        borderRight:
          hoveredColumn === activeColumn - 1
            ? "var(--TableColumn-activeBorder)"
            : "none",
      },
    }),
  };

  return (
    <CssVarsProvider theme={theme}>
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Sheet
          className="glass"
          sx={{
            userSelect: "none",
            pointerEvents: "auto",
            borderRadius: "6px",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            maxWidth: "1200px",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            flexGrow: 0,
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
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Sheet
                    ref={scrollRef}
                    onMouseDown={onDragStart}
                    onMouseMove={onDragMove}
                    onMouseUp={onDragEnd}
                    onMouseLeave={onDragLeave}
                    // onWheel={updateShadows}
                    sx={{
                      overflowX: "auto",
                      overflowY: "visible",
                      display: "block",
                      whiteSpace: "nowrap",
                      scrollbarWidth: "none",
                      "&::-webkit-scrollbar": { display: "none" },
                      cursor: isDragging ? "grabbing" : "grab",
                      borderRadius: "6px",
                      "--TableCell-height": "20px",
                      "--TableColumn-activeBorder":
                        "3px solid var(--joy-palette-primary-500, #0B6BCB)",
                      "--TableColumn-hoverBackground":
                        "3px solid var(--joy-palette-primary-100, #E3EFFB)",
                      "--TableColumn-transp": "3px solid transparent",
                      "--Table-firstColumnWidth": "150px",
                      "--Table-secondColumnWidth": "80px",
                      "--Table-lastColumnWidth": "0px",
                      "--Table-headerColumnWidth": "230px",
                      "--Table-bodyColumnWidth": "65px",
                      backgroundColor: "background.surface",
                    }}
                  >
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
                              {todayColumn === index + 3 ? (
                                <Chip
                                  color="primary"
                                  size="sm"
                                  variant="plain"
                                  className="today-chip"
                                  sx={{
                                    tableLayout: "fixed",
                                    position: "absolute",
                                    transform: "translate(-25px, -30px)",
                                    fontWeight: "bold",
                                    backgroundColor:
                                      hoveredColumn === index + 2
                                        ? "primary.300"
                                        : "primary.100",
                                    color: "primary.700",
                                    padding: "0 10px",
                                    fontSize: "0.85em",
                                  }}
                                >
                                  TODAY
                                </Chip>
                              ) : null}
                              <Typography
                                level="title-sm"
                                sx={{ fontWeight: 700 }}
                              >
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
                                if (isClickValid.current) {
                                  setActiveColumn(index + 3);
                                  setDate(data.date);
                                }
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
                          isClickValid={isClickValid}
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
                                if (isClickValid.current) {
                                  setActiveColumn(index + 3);
                                  setDate(data.date);
                                }
                              }}
                              style={{ minHeight: "28px" }}
                            >
                              {units.windDirection === "arrow" ? (
                                renderWindIcon(data)
                              ) : (
                                <Typography>{data.wind.direction}</Typography>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </Table>
                  </Sheet>

                  <Fade in={shadowLeft} timeout={100}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 80,
                        width: "24px",
                        height: "100%",
                        pointerEvents: "none",
                        background:
                          "linear-gradient(to right, rgba(0,0,0,0.12), transparent)",
                        zIndex: 1,
                      }}
                    />
                  </Fade>
                  <Fade in={shadowRight} timeout={100}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "24px",
                        height: "100%",
                        pointerEvents: "none",
                        background:
                          "linear-gradient(to left, rgba(0,0,0,0.2), transparent)",
                        zIndex: 1,
                        borderRadius: "6px",
                      }}
                    />
                  </Fade>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    width: "100%",
                    minWidth: "100px",
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
                            fontSize: "1.5rem",
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
                        setShadowLeft(false);
                      }}
                    >
                      <CloseIcon
                        sx={{
                          fontSize: "1.5rem",
                          color: "var(--joy-palette-neutral-700, #32383E)",
                        }}
                      />
                    </IconButton>
                  </Stack>

                  <Box sx={{ pr: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Typography
                        level="body-xs"
                        sx={{ me: "auto", minWidth: "60px" }}
                      >
                        {"LAT: " + location.latLng.lat.toFixed(4)}
                      </Typography>
                      <Typography level="body-xs" sx={{}}>
                        {"LONG: " + location.latLng.lng.toFixed(4)}
                      </Typography>
                    </Stack>
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
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "1200px",
                  height: "256px",
                  bgcolor: "common.white",
                  borderRadius: "6px",
                  boxSizing: "border-box",
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
                    sx={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                    }}
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
                        fontSize: "1.5rem",
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
                        <Typography level="h4" component="div">
                          Oops, sorry...
                        </Typography>
                        <Typography level="body-sm" component="div">
                          No municipal level forecast available. If you believe
                          this is a mistake, please submit a report.
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
            )}
          </Stack>
        </Sheet>
      </Slide>
    </CssVarsProvider>
  );
};

export default ForecastContainer;
