import React from "react";
import { format } from "date-fns";

import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardOverflow from "@mui/joy/CardOverflow";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Stack } from "@mui/material";
import Skeleton from "@mui/joy/Skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDroplet,
  faWind,
  faCloud,
  faCloudShowersHeavy,
} from "@fortawesome/free-solid-svg-icons";
import { TMaxIcon, TMeanIcon, TMinIcon } from "./CustomIcons";
import ForecastValue from "./ForecastValue";
import ToggleUnits from "./ToggleUnits";

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

const OVERLAY_CONFIG = {
  temperature_average: {
    title: "Ave Temperature",
    icon: <TMeanIcon style={{ fontSize: "1.5rem" }} />,
    getValue: (data) => data.temperature.mean,
  },
  temperature_minimum: {
    title: "Min Temperature",
    icon: <TMinIcon style={{ fontSize: "1.5rem" }} />,
    getValue: (data) => data.temperature.min,
  },
  temperature_maximum: {
    title: "Max Temperature",
    icon: <TMaxIcon style={{ fontSize: "1.5rem" }} />,
    getValue: (data) => data.temperature.max,
  },
  humidity: {
    title: "Humidity",
    icon: <FontAwesomeIcon icon={faDroplet} style={{ fontSize: "1.5rem" }} />,
    getValue: (data) => data.humidity,
  },
  wind: {
    title: "Wind",
    icon: <FontAwesomeIcon icon={faWind} style={{ fontSize: "1.5rem" }} />,
    getValue: (data) => data.wind.speed,
    getDirection: (data) => data.wind.direction,
  },
  rainfall: {
    title: "Rainfall",
    icon: (
      <FontAwesomeIcon
        icon={faCloudShowersHeavy}
        style={{ fontSize: "1.5rem" }}
      />
    ),
    getValue: (data) => data.rainfall.total,
  },
  cloud: {
    title: "Clouds",
    icon: <FontAwesomeIcon icon={faCloud} style={{ fontSize: "1.5rem" }} />,
    getValue: (data) => data.cloud_cover,
  },
};

// Memoized CardContent to re-render only when forecast changes
const PopupContent = React.memo(
  ({
    forecast,
    setOpenContainer,
    markerRef,
    handlePopupClose,
    overlay,
    forecastRetrieval,
    loading,
    units,
    setUnits,
  }) => {
    return !forecastRetrieval ? (
      <Card variant="plain" sx={{ minWidth: 360 }}>
        <Stack>
          <Typography level="title-lg">
            <Skeleton loading={loading}>
              {loading ? "Quezon City, Metro Manila" : "Oops, sorry..."}
            </Skeleton>
          </Typography>
          <Typography level="body-sm">
            <Skeleton loading={loading}>
              {loading ? "Friday, February 14, 2024" : " "}
            </Skeleton>
          </Typography>

          <IconButton
            variant="plain"
            color="neutral"
            size="sm"
            sx={{ position: "absolute", top: "0.875rem", right: "0.5rem" }}
            onClick={handlePopupClose}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
        <CardOverflow color="primary" variant="soft">
          <CardContent orientation="horizontal" sx={{ alignItems: "center" }}>
            {loading ? (
              <Skeleton variant="circular" width={34} height={34} />
            ) : (
              OVERLAY_CONFIG[overlay].icon
            )}
            {loading ? (
              <Skeleton variant="rectangular" width={40} height={30} />
            ) : (
              <Typography color="primary.softColor" level="body-sm">
                No municipal level forecast available
              </Typography>
            )}
          </CardContent>
        </CardOverflow>
      </Card>
    ) : (
      <Card variant="plain" sx={{ minWidth: 360, userSelect: "none" }}>
        <Stack>
          <Typography level="title-lg">
            <Skeleton loading={loading}>
              {loading
                ? "Quezon City, Metro Manila"
                : forecast.municity + ", " + forecast.province}
            </Skeleton>
          </Typography>
          <Typography level="body-sm">
            <Skeleton loading={loading}>
              {loading
                ? "Friday, February 14, 2024"
                : format(forecast.forecast.date, "EEEE, MMMM  d")}
            </Skeleton>
          </Typography>

          <IconButton
            variant="plain"
            color="neutral"
            size="sm"
            sx={{ position: "absolute", top: "0.875rem", right: "0.5rem" }}
            onClick={handlePopupClose}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
        <CardOverflow color="primary" variant="soft">
          <CardContent
            orientation="horizontal"
            sx={{ alignItems: "center", p: "5px 0" }}
          >
            {loading ? (
              <Skeleton variant="circular" width={34} height={34} />
            ) : (
              OVERLAY_CONFIG[overlay].icon
            )}
            {(() => {
              const config = OVERLAY_CONFIG[overlay];
              if (!config) return null;

              return (
                <Box>
                  <Stack
                    direction="column"
                    spacing={0}
                    sx={{
                      justifyContent: "center",
                      alignItems: "flex-start",
                      position: "relative",
                      bottom: 7,
                    }}
                  >
                    <Typography
                      level="body-xs"
                      sx={{
                        position: "relative",
                        top: 7,
                        color: "var(--joy-palette-primary-700, #12467B)",
                      }}
                    >
                      <Skeleton loading={loading}>
                        {loading ? "Ave. Temperature" : config.title}
                      </Skeleton>
                    </Typography>
                    <Typography
                      color="primary.softColor"
                      level={overlay === "cloud" ? "h4" : "h3"}
                    >
                      <Skeleton loading={loading}>
                        {loading ? (
                          "28°C"
                        ) : (
                          <>
                            <ForecastValue
                              value={config.getValue(forecast.forecast)}
                              overlay={overlay}
                              units={units}
                            />
                            &nbsp;
                            <ToggleUnits
                              context="popup"
                              overlay={overlay}
                              units={units}
                              setUnits={setUnits}
                            />
                            &nbsp;
                            {overlay === "wind" && (
                              <>
                                &nbsp;
                                {(() => {
                                  const direction = config.getDirection(
                                    forecast.forecast
                                  );
                                  const iconProps = {
                                    sx: {
                                      color: "primary.softColor",
                                    },
                                  };
                                  switch (direction) {
                                    case "N":
                                      return <NIcon {...iconProps} />;
                                    case "NNE":
                                      return <NNEIcon {...iconProps} />;
                                    case "NE":
                                      return <NEIcon {...iconProps} />;
                                    case "ENE":
                                      return <ENEIcon {...iconProps} />;
                                    case "E":
                                      return <EIcon {...iconProps} />;
                                    case "ESE":
                                      return <ESEIcon {...iconProps} />;
                                    case "SE":
                                      return <SEIcon {...iconProps} />;
                                    case "SSE":
                                      return <SSEIcon {...iconProps} />;
                                    case "S":
                                      return <SIcon {...iconProps} />;
                                    case "SSW":
                                      return <SSWIcon {...iconProps} />;
                                    case "SW":
                                      return <SWIcon {...iconProps} />;
                                    case "WSW":
                                      return <WSWIcon {...iconProps} />;
                                    case "W":
                                      return <WIcon {...iconProps} />;
                                    case "WNW":
                                      return <WNWIcon {...iconProps} />;
                                    case "NW":
                                      return <NWIcon {...iconProps} />;
                                    case "NNW":
                                      return <NNWIcon {...iconProps} />;
                                    default:
                                      return null;
                                  }
                                })()}
                              </>
                            )}
                          </>
                        )}
                      </Skeleton>
                    </Typography>
                  </Stack>
                </Box>
              );
            })()}
            {!loading && (
              <Button
                variant="solid"
                size="sm"
                color="primary"
                aria-label="See Forecast"
                sx={{ ml: "auto", alignSelf: "center", fontWeight: 600 }}
                endDecorator={<ExpandMoreIcon />}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent map interaction when button is clicked
                  markerRef.current.closePopup();
                  setOpenContainer(true);
                }}
              >
                Forecast
              </Button>
            )}
          </CardContent>
        </CardOverflow>
      </Card>
    );
  },

  (prevProps, nextProps) =>
    prevProps.forecast === nextProps.forecast &&
    prevProps.overlay === nextProps.overlay &&
    prevProps.units === nextProps.units
);

export default PopupContent;
