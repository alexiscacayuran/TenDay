import React, { useRef, useEffect } from "react";
import { Popup, Marker } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles.css";
import markerIconPng from "leaflet/dist/images/marker-icon.png";

import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import Divider from "@mui/joy/Divider";

const ForecastPopup = ({
  forecast,
  location,
  layerGroup,
  setOpenContainer,
  openContainer,
}) => {
  const markerRef = useRef(null); // Reference for React Leaflet Marker

  useEffect(() => {
    // Ensure the marker is added to the layerGroup when rendered
    if (markerRef.current && layerGroup.current) {
      const leafletMarker = markerRef.current; // React Leaflet automatically binds Leaflet instance
      layerGroup.current.clearLayers(); // Clear any existing layers in the group
      layerGroup.current.addLayer(leafletMarker); // Add the current marker to the group
    }
  }, [layerGroup]);

  // Event handler to remove marker when popup closes
  const handlePopupClose = () => {
    if (layerGroup.current && markerRef.current) {
      layerGroup.current.removeLayer(markerRef.current); // Remove the marker from layerGroup
    }
  };

  if (!location) return null; // Handle cases where position is not defined

  if (!openContainer && !forecast) {
    return (
      <Marker
        ref={markerRef}
        position={location.latLng}
        icon={
          new Icon({
            iconUrl: markerIconPng,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })
        }
        eventHandlers={{ add: (e) => e.target.openPopup() }}
      >
        <Popup offset={[0, -40]} onClose={handlePopupClose}>
          <div>
            <p>No data available</p>
          </div>
        </Popup>
      </Marker>
    );
  }

  if (openContainer) {
    return (
      <Marker
        ref={markerRef}
        position={location.latLng}
        icon={
          new DivIcon({
            className: "pulsating-marker",
          })
        }
      />
    );
  }

  const { municity, province } = forecast;
  const {
    date,
    start_date,
    rainfall,
    cloud_cover,
    temperature,
    humidity,
    wind,
  } = forecast.forecast;

  return (
    <Marker
      ref={markerRef}
      position={location.latLng}
      icon={
        new Icon({
          iconUrl: markerIconPng,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }
      eventHandlers={{ add: (e) => e.target.openPopup() }}
      draggable={true}
    >
      <Popup
        offset={[0, -30]}
        minWidth="320"
        onClose={handlePopupClose}
        closeButton={false}
      >
        <Card sx={{ width: 320 }}>
          <div>
            <Typography level="title-lg">{municity}</Typography>
            <Typography level="body-sm">{province}</Typography>
            <Divider inset="none" sx={{ mt: 1 }} />
            <IconButton
              variant="plain"
              color="neutral"
              size="sm"
              sx={{ position: "absolute", top: "0.875rem", right: "0.5rem" }}
              onClick={handlePopupClose}
            >
              <CloseIcon />
            </IconButton>
          </div>
          <CardContent orientation="horizontal">
            <div>
              <Typography level="body-xs">Ave. Temperature</Typography>
              <Typography
                sx={{ fontSize: "lg", fontWeight: "lg" }}
                startDecorator={<ThermostatIcon />}
              >
                {temperature.mean}&#176;C
              </Typography>
            </div>
            <Button
              variant="soft"
              size="md"
              color="primary"
              aria-label="See Forecast"
              sx={{ ml: "auto", alignSelf: "center", fontWeight: 600 }}
              endDecorator={<ExpandMoreIcon />}
              onClick={(e) => {
                e.stopPropagation(); //prevent map interaction when this button is clicked
                setOpenContainer(true);
              }}
            >
              See Forecast
            </Button>
          </CardContent>
        </Card>
      </Popup>
    </Marker>
  );
};

export default ForecastPopup;
