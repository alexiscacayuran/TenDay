import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, LayerGroup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";

import MapControl from "./MapControl";
import VectorBasemap from "./VectorBasemap";
import ReverseGeocode from "./ReverseGeocode";
import DateNavigation from "./DateNavigation";
import AppBar from "./AppBar";
import ForecastContainer from "./ForecastContainer";
import ForecastPopup from "./ForecastPopup";
import OverlayMenu from "./OverlayMenu";

import Box from "@mui/joy/Box";

const Map = () => {
  const accessToken =
    "AAPTxy8BH1VEsoebNVZXo8HurKsdWeDKRAbsiNAHNNT6jaWYypLJFqQTUuTnKsCor2bPmkCpMzOrhKexPvlodoF0x3XdMHV7blW62ufUMcT3gKihPOu4TcaTATBLWA_JI6CteZmk1RSE0SlFnhNfG2gSI8kl8egAcQiWmfV622MVLRCJyo5569gRgq-ct-dCD8eDVTOSW3pILfzsmmxvuTf_q96lARx7V_tstPR8WGt8vbg.AT1_tONBP2yK"; // Replace with your actual token
  const basemapEnum = "arcgis/light-gray";
  const bounds = useMemo(
    () =>
      L.latLngBounds([
        [4.64, 116.93],
        [20.94, 126.61],
      ]).pad(0.2),
    []
  );
  const [location, setLocation] = useState({
    latLng: {},
    municity: "",
    province: "",
  });

  const [map, setMap] = useState(null); // External state for the map instance
  const layerGroup = useRef(null); // Shared LayerGroup reference
  const [open, setOpen] = useState(false); // Slide up bottom container state

  const [dateReady, setDateReady] = useState(false); // Track readiness of `latest_date`
  const startDate = useRef(null); // Store the `latest_date`
  const [date, setDate] = useState(null);

  const [overlay, setOverlay] = useState("temperature_average");
  console.log("Map rendered");

  useEffect(() => {
    // Function to fetch data from the API
    const fetchDate = async () => {
      try {
        const response = await axios.get("/valid");
        startDate.current = response.data; // Store the fetched data
        setDate(startDate.current.latest_date);
        setDateReady(true); // Set readiness to true once data is fetched
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchDate(); // Trigger the data fetch when the component mounts
  }, []); // Empty dependency array to run only on component mount

  const displayMap = useMemo(
    () => (
      <Box sx={{ maxHeight: "100vh" }}>
        <AppBar
          accessToken={accessToken}
          map={map}
          layerGroup={layerGroup}
          location={location}
          setLocation={setLocation}
          setOpenContainer={setOpen}
          openContainer={open}
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
          <VectorBasemap basemap={basemapEnum} accessToken={accessToken} />
          {map && (
            <ReverseGeocode
              accessToken={accessToken}
              layerGroup={layerGroup}
              location={location}
              setLocation={setLocation}
              setOpenContainer={setOpen}
              openContainer={open}
              date={date}
              overlay={overlay}
            />
          )}
        </MapContainer>
        <OverlayMenu setOverlay={setOverlay} overlay={overlay} />
        {map && <MapControl map={map} />}
        {dateReady &&
          !open && ( // Render DateNavigation only if `dateReady` is true
            <DateNavigation
              initialDate={new Date(startDate.current.latest_date)} // Pass the fetched `latest_date`
              range={10}
              setDate={setDate}
            />
          )}
        <ForecastContainer
          open={open}
          setOpen={setOpen}
          location={location}
          layerGroup={layerGroup}
        />
      </Box>
    ),
    [map, bounds, accessToken, open, location, dateReady, date, overlay] // Dependencies for memoization
  );

  return <div>{displayMap}</div>;
};

export default Map;
