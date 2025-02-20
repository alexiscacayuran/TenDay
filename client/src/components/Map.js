import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, LayerGroup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";

import MapControl from "./MapControl";
import Basemap from "./Basemap";
import ReverseGeocode from "./ReverseGeocode";
import DateNavigation from "./DateNavigation";
import Navbar from "./Navbar";
import ForecastContainer from "./ForecastContainer";
import OverlayMenu from "./OverlayMenu";

import Box from "@mui/joy/Box";
import Overlay from "./Overlay";

const Map = () => {
  const accessToken =
    "AAPTxy8BH1VEsoebNVZXo8HurKsdWeDKRAbsiNAHNNT6jaWYypLJFqQTUuTnKsCor2bPmkCpMzOrhKexPvlodoF0x3XdMHV7blW62ufUMcT3gKihPOu4TcaTATBLWA_JI6CteZmk1RSE0SlFnhNfG2gSI8kl8egAcQiWmfV622MVLRCJyo5569gRgq-ct-dCD8eDVTOSW3pILfzsmmxvuTf_q96lARx7V_tstPR8WGt8vbg.AT1_tONBP2yK"; // Replace with your actual token
  const baseEnum = "arcgis/light-gray/base";
  const labelsEnum = "arcgis/light-gray/labels";
  const bounds = useMemo(
    () =>
      L.latLngBounds([
        [4.64, 116.93],
        [20.94, 126.61],
      ]),
    []
  );
  const [location, setLocation] = useState({
    latLng: {},
    municity: "",
    province: "",
  });

  const [map, setMap] = useState(null); // External state for the map instance
  const markerLayer = useRef(null);
  const [open, setOpen] = useState(false); // Slide up bottom container state
  const startDate = useRef(null);
  const [date, setDate] = useState(null);
  const [dateReady, setDateReady] = useState(false);
  const [overlay, setOverlay] = useState("temperature_average");
  const overlayLayer = useRef(null);
  const [isDiscrete, setIsDiscrete] = useState(false);

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
        <Navbar
          accessToken={accessToken}
          map={map}
          markerLayer={markerLayer}
          location={location}
          setLocation={setLocation}
          setOpenContainer={setOpen}
          openContainer={open}
        />
        <MapContainer
          center={[13, 122]}
          zoom={8}
          minZoom={5} //5
          maxZoom={20}
          maxBounds={bounds}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          ref={setMap} // Set map instance to external state
        >
          <LayerGroup ref={markerLayer} />
          <LayerGroup ref={overlayLayer} />
          <Basemap basemap={baseEnum} accessToken={accessToken} />

          {dateReady && (
            <Overlay
              startDate={startDate}
              overlay={overlay}
              date={date}
              overlayLayer={overlayLayer}
              isDiscrete={isDiscrete}
            />
          )}

          <Basemap basemap={labelsEnum} accessToken={accessToken} />

          {map && (
            <ReverseGeocode
              accessToken={accessToken}
              markerLayer={markerLayer}
              location={location}
              setLocation={setLocation}
              setOpenContainer={setOpen}
              openContainer={open}
              date={date}
              overlay={overlay}
            />
          )}
        </MapContainer>

        <OverlayMenu
          setOverlay={setOverlay}
          overlay={overlay}
          setIsDiscrete={setIsDiscrete}
          isDiscrete={isDiscrete}
        />
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
          markerLayer={markerLayer}
        />
      </Box>
    ),
    [
      map,
      bounds,
      accessToken,
      open,
      location,
      dateReady,
      date,
      overlay,
      isDiscrete,
    ] // Dependencies for memoization
  );

  return <div>{displayMap}</div>;
};

export default Map;
