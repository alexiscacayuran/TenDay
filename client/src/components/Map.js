import React, { useState, useRef, useMemo } from "react";
import { MapContainer, ZoomControl, LayerGroup } from "react-leaflet";
import L from "leaflet";

import VectorBasemap from "./VectorBasemap";
import ReverseGeocode from "./ReverseGeocode";
import Geosearch from "./Geosearch";
import DateNavigation from "./DateNavigation";
import { Box } from "@mui/material";

const Map = () => {
  const accessToken =
    "AAPTxy8BH1VEsoebNVZXo8HurKsdWeDKRAbsiNAHNNT6jaUIH6Oi8DVQxlQNlgJ2NGag5CZoTCLmwUifs4KdV-ulF6A5N7NefR0m6pAGXfeizirbpfE96mEFu5jlt2UakL2z55jRFySaoldDbYJ9MPCgYc-sYslYMoWfCGGg90spQczysdX-XGyy9GFe9ESnHI0m8Kxc35mFQ_C1OSfwfWR8_0Pie-hNQuzWTmv3VAUmxe4.AT1_XXGKpVpT"; // Replace with your actual token
  const basemapEnum = "arcgis/light-gray";
  const bounds = useMemo(
    () =>
      L.latLngBounds([
        [4.64, 116.93],
        [20.94, 126.61],
      ]).pad(0.2),
    []
  );
  const [location, setLocation] = useState({ municity: "", province: "" });
  const [map, setMap] = useState(null); // External state for the map instance
  const layerGroup = useRef(null); // Shared LayerGroup reference
  const [date, setDate] = useState(new Date().now());

  const displayMap = useMemo(
    () => (
      <div>
        <MapContainer
          center={[13, 122]}
          zoom={6}
          minZoom={6}
          maxZoom={15}
          maxBounds={bounds}
          zoomControl={false}
          ref={setMap} // Set map instance to external state
        >
          <LayerGroup ref={layerGroup} />
          <ZoomControl position="topright" />
          <VectorBasemap basemap={basemapEnum} accessToken={accessToken} />
          {map && (
            <ReverseGeocode
              accessToken={accessToken}
              setLocation={setLocation}
              layerGroup={layerGroup}
            />
          )}
        </MapContainer>
        <Box sx={{ position: "fixed", top: "10px" }}>
          <Geosearch
            accessToken={accessToken}
            setLocation={setLocation}
            map={map}
          />
        </Box>
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%", // Optional width adjustment
            maxWidth: 400, // Optional max width
          }}
        >
          <DateNavigation></DateNavigation>
        </Box>
      </div>
    ),
    [map, bounds, accessToken] // Dependencies for memoization
  );

  return <div>{displayMap}</div>;
};

export default Map;
