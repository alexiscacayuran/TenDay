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
    getValue: (data) => `${data.temperature.mean}°C`,
  },
  temperature_minimum: {
    icon: faTemperatureEmpty,
    getValue: (data) => `${data.temperature.min}°C`,
  },
  temperature_maximum: {
    icon: faTemperatureFull,
    getValue: (data) => `${data.temperature.max}°C`,
  },
  humidity: {
    icon: faDroplet,
    getValue: (data) => `${data.humidity}%`,
  },
  wind: {
    icon: faWind,
    getValue: (data) => `${data.wind.speed}m/s`,
  },
  rainfall: {
    icon: faUmbrella,
    getValue: (data) => `${data.rainfall}`,
  },
  cloud: {
    icon: faCloud,
    getValue: (data) => `${data.cloud_cover}`,
  },
};

// Memoized CardContent to re-render only when forecast changes
const PopupContent = React.memo(
  ({ forecast, setOpenContainer, markerRef, handlePopupClose, overlay }) => {
    console.log("Popup content rendered");
    if (!forecast || !forecast.forecast) {
      return (
        <Card variant="soft" sx={{ minWidth: 320 }}>
          <Box>
            <Typography level="body-sm" sx={{ textAlign: "center" }}>
              No data available
            </Typography>
          </Box>
        </Card>
      );
    }

    const { temperature, humidity, wind, rainfall, cloud_cover } =
      forecast.forecast;

    return (
      <Card variant="plain" sx={{ minWidth: 320 }}>
        <Stack>
          <Typography level="title-lg">
            {forecast.municity + ", " + forecast.province}
          </Typography>
          <Typography level="body-sm">
            {format(forecast.forecast.date, "EEEE, MMMM  d")}
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
            {(() => {
              const config = OVERLAY_CONFIG[overlay];
              if (!config) return null;

              return overlay !== "rainfall" && overlay !== "cloud" ? (
                <>
                  <FontAwesomeIcon
                    icon={config.icon}
                    style={{ fontSize: "2rem" }}
                  />
                  {
                    <Typography color="--variant-softColor" level="h3">
                      {config.getValue(forecast.forecast)}
                    </Typography>
                  }
                </>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={config.icon}
                    style={{ fontSize: "2rem" }}
                  />
                  <Typography color="--variant-softColor" level="title-md">
                    {config.getValue(forecast.forecast)}
                  </Typography>
                </>
              );
            })()}

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
