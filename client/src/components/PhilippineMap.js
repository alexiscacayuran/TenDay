import React from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";
import municities from "../data/municities.json";
import "leaflet/dist/leaflet.css";
import SearchCard from "./SearchCard";
import { divIcon, DivOverlay } from "leaflet";
import { Box, Container } from "@mui/material";

export default function PhilippineMap() {
  const mapStyle = {
    fillColor: "#187498",
    weight: 1.5,
    color: "#187498",
    fillOpacity: 0.1,
  };

  function onEachMunicity(municity, layer) {
    const municityName = municity.properties.municity;
    layer.bindPopup(municityName);
  }

  function filterByProvince(municity) {
    if (municity.properties.province === "Pampanga") return true;
  }

  return (
    <Container>
      <MapContainer center={[13, 122]} zoom={6} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {/* {municities.features.map((municity) => {
        const coordinates = municity.geometry.coordinates
      })} */}
        <GeoJSON
          data={municities.features}
          style={mapStyle}
          onEachFeature={onEachMunicity}
          filter={filterByProvince}
        />
        <ZoomControl position="topright" />
      </MapContainer>

      <Box sx={{ position: "fixed", top: "10px" }}>
        <SearchCard />
      </Box>
    </Container>
  );
}
