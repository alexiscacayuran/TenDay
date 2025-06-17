import React, { useState, useEffect, Fragment, useRef } from "react";
import axios from "axios";
import { format } from "date-fns";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Slide, Fade } from "@mui/material";
import {
  Box,
  Stack,
  Sheet,
  Typography,
  IconButton,
  Table,
  Button,
} from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import CloseIcon from "@mui/icons-material/Close";
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
} from "../utils/CustomIcons";

import ForecastTable from "./ForecastTable";
import MunicitySelector from "./MunicitySelector";
import ToggleUnits from "../utils/ToggleUnits";
import DownloadDialog from "./DownloadDialog";

let isInitial = true;

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
  const [forecast, setForecast] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [todayColumn, setTodayColumn] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

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
  const isBelowLaptop = useMediaQuery((theme) => theme.breakpoints.down("lg"));

  useEffect(() => {
    setShadowLeft(false);
  }, [isBelowLaptop]);

  const updateShadows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    //console.dir(el);
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
    if (isInitial) {
      isInitial = false;
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
    const dynamicIconWidth = { width: !isMobile ? "30px" : "20px" };
    switch (data.rainfall.description) {
      case "NO RAIN":
        switch (data.cloud_cover) {
          case "SUNNY":
            return <SunnyIcon style={dynamicIconWidth} />;
          case "PARTLY CLOUDY":
            return <NoRainParCloudyIcon style={dynamicIconWidth} />;
          case "MOSTLY CLOUDY":
            return <NoRainMosCloudyIcon style={dynamicIconWidth} />;
          case "CLOUDY":
            return <NoRainCloudyIcon style={dynamicIconWidth} />;
          default:
            return null;
        }
      case "LIGHT RAINS":
        switch (data.cloud_cover) {
          case "SUNNY":
            return <LightRainsSunnyIcon style={dynamicIconWidth} />;
          case "PARTLY CLOUDY":
            return <LightRainsParCloudyIcon style={dynamicIconWidth} />;
          case "MOSTLY CLOUDY":
            return <LightRainsMosCloudyIcon style={dynamicIconWidth} />;
          case "CLOUDY":
            return <LightRainsCloudyIcon style={dynamicIconWidth} />;
          default:
            return null;
        }
      case "MODERATE RAINS":
        switch (data.cloud_cover) {
          case "SUNNY":
            return <ModRainsParCloudyIcon style={dynamicIconWidth} />;
          case "PARTLY CLOUDY":
            return <ModRainsParCloudyIcon style={dynamicIconWidth} />;
          case "MOSTLY CLOUDY":
            return <ModRainsMosCloudyIcon style={dynamicIconWidth} />;
          case "CLOUDY":
            return <ModRainsCloudyIcon style={dynamicIconWidth} />;
          default:
            return null;
        }
      case "HEAVY RAINS":
        switch (data.cloud_cover) {
          case "SUNNY":
            return <HeavyRainsParCloudyIcon style={dynamicIconWidth} />;
          case "PARTLY CLOUDY":
            return <HeavyRainsParCloudyIcon style={dynamicIconWidth} />;
          case "MOSTLY CLOUDY":
            return <HeavyRainsMosCloudyIcon style={dynamicIconWidth} />;
          case "CLOUDY":
            return <HeavyRainsCloudyIcon style={dynamicIconWidth} />;
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
    fontSize: !isMobile ? "0.75rem" : "0.65rem",
    width: "100%",
    "& thead > tr > th": {
      bgcolor: "neutral.softBg",
    },

    "& thead > tr p": {
      color: "neutral.softColor",
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
      height: "30px",
    },

    // table border adjustments
    "& thead tr:first-of-type > td:first-of-type": {
      borderTopLeftRadius: "lg",
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
        bgcolor: hoveredColumn === activeColumn - 1 ? "neutral.200" : "none",
      },
      [`& tbody tr:not(:last-of-type) > td:nth-of-type(${activeColumn - 2})`]: {
        borderLeft: "var(--TableColumn-activeBorder)",
        borderRight: "var(--TableColumn-activeBorder)",
        bgcolor:
          hoveredColumn === activeColumn - 1 ? "neutral.softHoverBg" : "none",
      },
      [`& tbody tr:last-of-type > td:nth-of-type(${activeColumn - 2})`]: {
        borderLeft: "var(--TableColumn-activeBorder)",
        borderRight: "var(--TableColumn-activeBorder)",
        borderBottom: "var(--TableColumn-activeBorder)",
        bgcolor:
          hoveredColumn === activeColumn - 1 ? "neutral.softHoverBg" : "none",
      },
    }),

    ...(hoveredColumn !== null && {
      [`& thead tr > th:nth-of-type(${hoveredColumn + 1})`]: {
        bgcolor: "neutral.300",
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
          bgcolor: "neutral.softHoverBg",
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
        bgcolor: "neutral.softHoverBg",
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

  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const submitFeedback = async (location) => {
    setLoading(true);
    try {
      const response = await axios.post("api/postFeedback", {
        category: 1,
        location: location,
        comment: "",
        email: "",
      });

      console.log("Feedback submitted:", response.data.feedback);
    } catch (err) {
      if (err.response) {
        console.error("Server error:", err.response.data.error);
      } else {
        console.error("Network error:", err.message);
      }
    } finally {
      setLoading(false); // ✅ Reset loading state
      setOpenSnackbar(true);
    }
  };

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Sheet
        className={!isMobile ? "glass" : ""}
        sx={{
          userSelect: "none",
          pointerEvents: "auto",
          borderRadius: "lg",
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
          direction={!isMobile ? "row" : "column-reverse"}
          spacing={0}
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
                    borderRadius: !isMobile ? "lg" : "none",
                    "--TableCell-height": !isMobile ? "20px" : "20px",
                    "--TableColumn-activeBorder":
                      "3px solid var(--joy-palette-primary-500, #0B6BCB)",
                    "--TableColumn-hoverBackground":
                      "3px solid var(--joy-palette-primary-100, #E3EFFB)",
                    "--TableColumn-transp": "3px solid transparent",
                    "--Table-firstColumnWidth": !isMobile ? "150px" : "125px",
                    "--Table-secondColumnWidth": !isMobile ? "80px" : "60px",
                    "--Table-lastColumnWidth": "0px",
                    "--Table-headerColumnWidth": "230px",
                    "--Table-bodyColumnWidth": !isMobile ? "65px" : "60px",
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
                            {/* {todayColumn === index + 3 ? (
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
                            ) : null} */}
                            <Typography
                              level="title-sm"
                              sx={{
                                fontWeight: 700,
                                fontSize: !isMobile ? "0.8rem" : "0.7rem",
                              }}
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
                            sx={{
                              fontSize: !isMobile ? "0.8rem" : "0.6rem",
                              minHeight: 0,
                            }}
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
                      left: !isMobile ? 80 : 60,
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
                      borderRadius: !isMobile ? "lg" : "none",
                    }}
                  />
                </Fade>
              </Box>

              <Stack
                direction={!isMobile ? "column" : "row-reverse"}
                spacing={0}
                sx={{
                  p: 1,
                  width: "100%",
                  minWidth: "100px",
                  maxWidth: !isMobile ? "220px" : "100%",
                  height: !isMobile ? "100%" : "auto",
                  justifyContent: !isMobile ? "unset" : "space-between",
                }}
              >
                <Stack
                  direction="row"
                  spacing={0}
                  sx={{
                    position: "relative",
                    justifyContent: "space-between",
                    alignItems: "flex-start",

                    mb: !isMobile ? 1 : 0,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0}
                    sx={{
                      position: "relative",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                    }}
                  >
                    <IconButton
                      size="sm"
                      color="inherit"
                      aria-label="favorite"
                      onClick={() => {}}
                    >
                      <FontAwesomeIcon
                        icon={faBookmark}
                        style={{
                          fontSize: "1rem",
                          color: "var(--joy-palette-neutral-700, #32383E)",
                        }}
                      />
                    </IconButton>
                    <DownloadDialog
                      serverToken={serverToken}
                      location={location}
                      forecast={forecast}
                      units={units}
                    />
                  </Stack>
                  <IconButton
                    size="sm"
                    color="inherit"
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

                <Stack
                  spacing={1}
                  direction="column"
                  sx={{
                    mr: 1,
                    flexGrow: 1,
                    justifyContent: "flex-start",
                    "& root > :not(style) ~ :not(style)": {
                      mb: "0 !important",
                    },
                  }}
                >
                  {!isMobile && (
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
                  )}

                  <MunicitySelector
                    map={map}
                    arcgisToken={arcgisToken}
                    serverToken={serverToken}
                    forecast={forecast}
                    setLocation={setLocation}
                    selectedPolygon={selectedPolygon}
                  />
                  {!isMobile && (
                    <Typography level="title-sm">
                      {forecast.province}
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </>
          ) : (
            <Box
              sx={{
                width: "100%",
                maxWidth: "1200px",
                height: "231.81px",
                bgcolor: "common.white",
                borderRadius: !isMobile ? "lg" : "none",
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
                    zIndex: 1200,
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
                        <form
                          onSubmit={async (event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            const location = formData.get("location");
                            await submitFeedback(location);

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
                        >
                          <input
                            type="hidden"
                            name="location"
                            value={location.municity + ", " + location.province}
                          />
                          <Button
                            type="submit"
                            color="neutral"
                            onClick={() => {}}
                            variant="soft"
                          >
                            Report
                          </Button>
                        </form>
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
  );
};

export default ForecastContainer;
