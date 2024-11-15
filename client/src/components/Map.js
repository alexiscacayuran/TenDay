import React, { useState, useRef, useMemo } from "react";
import { MapContainer, LayerGroup } from "react-leaflet";
import L from "leaflet";

import MapControl from "./MapControl";
import VectorBasemap from "./VectorBasemap";
import ReverseGeocode from "./ReverseGeocode";
import DateNavigation from "./DateNavigation";
import ButtonAppBar from "./ButtonAppBar";

import Box from "@mui/joy/Box";
import ForecastContainer from "./ForecastContainer";

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
  // console.log(location);
  const [map, setMap] = useState(null); // External state for the map instance
  const layerGroup = useRef(null); // Shared LayerGroup reference
  //const [date, setDate] = useState();
  const [open, setOpen] = useState(false);

  const displayMap = useMemo(
    () => (
      <Box sx={{ maxHeight: "100vh" }}>
        <ButtonAppBar
          accessToken={accessToken}
          map={map}
          setLocation={setLocation}
          setOpenContainer={setOpen}
        />
        <MapContainer
          center={[13, 122]}
          zoom={6}
          minZoom={6}
          maxZoom={20}
          maxBounds={bounds}
          zoomControl={false}
          ref={setMap} // Set map instance to external state
        >
          <LayerGroup ref={layerGroup} />
          <MapControl />
          <VectorBasemap basemap={basemapEnum} accessToken={accessToken} />
          {map && (
            <ReverseGeocode
              accessToken={accessToken}
              setLocation={setLocation}
              layerGroup={layerGroup}
            />
          )}
        </MapContainer>

        {!open && (
          <DateNavigation
            initialDate={new Date()}
            range={10}
            onPageChange={(date) => {
              console.log(date);
            }}
          />
        )}

        <ForecastContainer open={open} setOpen={setOpen} location={location} />
      </Box>
    ),
    [map, bounds, accessToken, open, location] // Dependencies for memoization
  );

  return <div>{displayMap}</div>;
};

export default Map;
