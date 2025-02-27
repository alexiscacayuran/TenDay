import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, LayerGroup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import MapControl from "./MapControl";
import Base from "./Base";
import Labels from "./Labels";
import ReverseGeocode from "./ReverseGeocode";
import DateNavigation from "./DateNavigation";
import Navbar from "./Navbar";
import ForecastContainer from "./ForecastContainer";
import OverlayMenu from "./OverlayMenu";
import Box from "@mui/joy/Box";
import Overlay from "./Overlay";
import Legend from "./Legend";

const Map = () => {
  const accessToken =
    "AAPTxy8BH1VEsoebNVZXo8HurKsdWeDKRAbsiNAHNNT6jaVG2ojxTBr-5nRVBxNkz2GPU7F3yhEetf5AjVaOJNz0DKs-0ZBCT2bi95Q5-eKNU-jrt5ESliwny0Wg9q86ezlZl0MdJ-s6UupkfpQqcwjOdfxBmkajgfMVWB5DbH-GloSWc009EAKmv8yixdu3uwElTcmw1_kIXuHrNS3wsvhaRbuCYfIesTWARfQq2Dr035HOOiTeBQTOdVk29zD6HSO9AT1_4iEh8Wxe";

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
          {dateReady && (
            <Overlay
              startDate={startDate}
              overlay={overlay}
              date={date}
              overlayLayer={overlayLayer}
              isDiscrete={isDiscrete}
            />
          )}
          <Base accessToken={accessToken} />

          <Labels accessToken={accessToken} />

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
          <MapControl />
        </MapContainer>

        <OverlayMenu
          setOverlay={setOverlay}
          overlay={overlay}
          setIsDiscrete={setIsDiscrete}
          isDiscrete={isDiscrete}
        />

        <Legend overlay={overlay} isDiscrete={isDiscrete} />

        {dateReady &&
          !open && ( // Render DateNavigation only if `dateReady` is true
            <DateNavigation
              initialDate={new Date(startDate.current.latest_date)} // Pass the fetched `latest_date`
              range={10}
              setDate={setDate}
              date={date}
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
