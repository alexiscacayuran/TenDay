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
  temperature_mean: {
    title: "Mean Temperature",
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
    setOpen,
    markerRef,
    handlePopupClose,
    overlay,
    forecastRetrieval,
    loading,
    units,
    setUnits,
  }) => {
    return !forecastRetrieval ? (
      <Card
        className="glass"
        variant="plain"
        sx={{ minWidth: 365, userSelect: "none" }}
      >
        <Stack>
          <Typography level="title-lg">
            <Skeleton
              loading={loading}
              sx={{ borderRadius: "md", opacity: 0.5 }}
            >
              {loading ? "Quezon City, Metro Manila" : "Oops, sorry..."}
            </Skeleton>
          </Typography>
          <Typography level="body-sm">
            <Skeleton
              loading={loading}
              sx={{ borderRadius: "md", opacity: 0.5 }}
            >
              {loading ? "Friday, February 14, 2024" : " "}
            </Skeleton>
          </Typography>

          <IconButton
            variant="plain"
            color="inherit"
            sx={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              fontSize: "1.5rem",
            }}
            onClick={handlePopupClose}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
        <CardOverflow color="primary" variant="soft" sx={{ minHeight: 51 }}>
          <CardContent orientation="horizontal" sx={{ alignItems: "center" }}>
            {loading ? (
              <Skeleton variant="circular" width={34} height={34} />
            ) : (
              OVERLAY_CONFIG[overlay].icon
            )}
            {loading ? (
              <Skeleton
                variant="rectangular"
                width={100}
                height={30}
                sx={{ borderRadius: "md" }}
              />
            ) : (
              <Typography color="primary.softColor" level="body-sm">
                No municipal level forecast available
              </Typography>
            )}
            {loading ? (
              <Skeleton
                variant="rectangular"
                width={106}
                height={30}
                sx={{ borderRadius: "md", ml: "auto" }}
              />
            ) : null}
          </CardContent>
        </CardOverflow>
      </Card>
    ) : (
      <Card
        className="glass"
        variant="plain"
        sx={{ minWidth: 365, userSelect: "none" }}
      >
        <Stack>
          <Typography level="title-lg">
            {forecast.municity + ", " + forecast.province}
          </Typography>
          <Typography level="body-sm">
            {format(forecast.forecast.date, "EEEE, MMMM  d")}
          </Typography>

          <IconButton
            variant="plain"
            color="inherit"
            size="sm"
            sx={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
            }}
            onClick={handlePopupClose}
          >
            <CloseIcon
              sx={{
                fontSize: "1.5rem",
                color: "var(--joy-palette-neutral-700, #32383E)",
              }}
            />
          </IconButton>
        </Stack>
        <CardOverflow color="primary" variant="soft">
          <CardContent
            orientation="horizontal"
            sx={{ alignItems: "center", p: "5px 0" }}
          >
            {OVERLAY_CONFIG[overlay].icon}

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
                      {loading ? "Mean Temp" : config.title}
                    </Typography>
                    <Typography
                      color="primary.softColor"
                      level={overlay === "cloud" ? "h4" : "h3"}
                      sx={{ fontSize: overlay === "cloud" && "1rem" }}
                    >
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

                                const renderDirection = (
                                  IconComponent,
                                  direction
                                ) => (
                                  <>
                                    <IconComponent
                                      sx={{
                                        height: "auto",
                                        width: "15px !important",
                                      }}
                                    />
                                    &nbsp;
                                    <Typography
                                      level="body-lg"
                                      sx={{ color: "gray" }}
                                      component="span"
                                    >
                                      {direction}
                                    </Typography>
                                  </>
                                );

                                switch (direction) {
                                  case "N":
                                    return renderDirection(NIcon, direction);
                                  case "NNE":
                                    return renderDirection(NNEIcon, direction);
                                  case "NE":
                                    return renderDirection(NEIcon, direction);
                                  case "ENE":
                                    return renderDirection(ENEIcon, direction);
                                  case "E":
                                    return renderDirection(EIcon, direction);
                                  case "ESE":
                                    return renderDirection(ESEIcon, direction);
                                  case "SE":
                                    return renderDirection(SEIcon, direction);
                                  case "SSE":
                                    return renderDirection(SSEIcon, direction);
                                  case "S":
                                    return renderDirection(SIcon, direction);
                                  case "SSW":
                                    return renderDirection(SSWIcon, direction);
                                  case "SW":
                                    return renderDirection(SWIcon, direction);
                                  case "WSW":
                                    return renderDirection(WSWIcon, direction);
                                  case "W":
                                    return renderDirection(WIcon, direction);
                                  case "WNW":
                                    return renderDirection(WNWIcon, direction);
                                  case "NW":
                                    return renderDirection(NWIcon, direction);
                                  case "NNW":
                                    return renderDirection(NNWIcon, direction);
                                  default:
                                    return null;
                                }
                              })()}
                            </>
                          )}
                        </>
                      )}
                    </Typography>
                  </Stack>
                </Box>
              );
            })()}

            <Button
              variant="solid"
              size="sm"
              color="primary"
              aria-label="See Forecast"
              sx={{ ml: "auto", alignSelf: "center", fontWeight: 600 }}
              endDecorator={<ExpandMoreIcon sx={{ fontSize: "1.5rem" }} />}
              onClick={(e) => {
                e.stopPropagation(); // Prevent map interaction when button is clicked
                markerRef.current.closePopup();
                setOpen(true);
              }}
            >
              Forecast
            </Button>
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
