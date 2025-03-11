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
import ThermostatIcon from "@mui/icons-material/Thermostat";
import Divider from "@mui/joy/Divider";
import { Stack } from "@mui/material";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Skeleton from "@mui/joy/Skeleton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTemperatureHalf,
  faTemperatureFull,
  faTemperatureEmpty,
  faDroplet,
  faWind,
  faUmbrella,
  faCloud,
} from "@fortawesome/free-solid-svg-icons";

const OVERLAY_CONFIG = {
  temperature_average: {
    icon: faTemperatureHalf,
    getValue: (data) => `${data.temperature.mean} °C`,
  },
  temperature_minimum: {
    icon: faTemperatureEmpty,
    getValue: (data) => `${data.temperature.min} °C`,
  },
  temperature_maximum: {
    icon: faTemperatureFull,
    getValue: (data) => `${data.temperature.max} °C`,
  },
  humidity: {
    icon: faDroplet,
    getValue: (data) => `${data.humidity} %`,
  },
  wind: {
    icon: faWind,
    getValue: (data) => `${data.wind.speed} m/s`,
  },
  rainfall: {
    icon: faUmbrella,
    getValue: (data) => `${data.rainfall.total} mm`,
  },
  cloud: {
    icon: faCloud,
    getValue: (data) => `${data.cloud_cover}`,
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
  }) => {
    console.log(forecast);

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
              <FontAwesomeIcon
                icon={OVERLAY_CONFIG[overlay].icon}
                style={{ fontSize: "2rem" }}
              />
            )}
            {loading ? (
              <Skeleton variant="rectangular" width={40} height={30} />
            ) : (
              <Typography color="--variant-softColor" level="body-sm">
                No municipal level forecast available
              </Typography>
            )}
          </CardContent>
        </CardOverflow>
      </Card>
    ) : (
      <Card variant="plain" sx={{ minWidth: 360 }}>
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
          <CardContent orientation="horizontal" sx={{ alignItems: "center" }}>
            {loading ? (
              <Skeleton variant="circular" width={34} height={34} />
            ) : (
              <FontAwesomeIcon
                icon={OVERLAY_CONFIG[overlay].icon}
                style={{ fontSize: "2rem" }}
              />
            )}
            {(() => {
              const config = OVERLAY_CONFIG[overlay];
              if (!config) return null;

              return (
                <Typography
                  color="--variant-softColor"
                  level={overlay === "cloud" ? "title-md" : "h3"}
                >
                  <Skeleton loading={loading}>
                    {loading ? "28°C" : config.getValue(forecast.forecast)}
                  </Skeleton>
                </Typography>
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
    prevProps.overlay === nextProps.overlay
);

export default PopupContent;
