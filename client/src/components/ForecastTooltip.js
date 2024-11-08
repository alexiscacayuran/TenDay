import React, { useRef, useEffect } from "react";
import { Marker, Tooltip } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles.css";
import markerIconPng from "leaflet/dist/images/marker-icon.png";

const ForecastTooltip = ({ forecast, position, layerGroup }) => {
  const markerRef = useRef(null); // Use ref to capture marker instance

  // Effect to add marker to layerGroup when markerRef is set
  useEffect(() => {
    if (markerRef.current && layerGroup.current) {
      // Clear existing markers
      layerGroup.current.clearLayers();
      layerGroup.current.addLayer(markerRef.current);
    }
  }, [layerGroup, position]);

  // if (!position) return null; // Handle cases where position might not be defined

  if (forecast === null)
    return (
      <Marker
        ref={markerRef}
        position={position}
        icon={
          new Icon({
            iconUrl: markerIconPng,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })
        }
      >
        <Tooltip direction="top" permanent offset={[0, -40]}>
          <div>
            <p>No data available</p>
          </div>
        </Tooltip>
      </Marker>
    );

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
      position={position}
      icon={
        new Icon({
          iconUrl: markerIconPng,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }
    >
      <Tooltip direction="top" permanent offset={[0, -40]}>
        <div>
          <h2>{municity}</h2>
          <h3>{province}</h3>
          <h4>Forecast for {date}</h4>
          <p>
            <strong>Start Date:</strong> {start_date}
          </p>
          <p>
            <strong>Rainfall:</strong> {rainfall}
          </p>
          <p>
            <strong>Cloud Cover:</strong> {cloud_cover}
          </p>
          <p>
            <strong>Temperature:</strong> Mean {temperature.mean}°C, Min{" "}
            {temperature.min}°C, Max {temperature.max}°C
          </p>
          <p>
            <strong>Humidity:</strong> {humidity}%
          </p>
          <p>
            <strong>Wind:</strong> {wind.speed} m/s {wind.direction}
          </p>
        </div>
      </Tooltip>
    </Marker>
  );
};

export default ForecastTooltip;
