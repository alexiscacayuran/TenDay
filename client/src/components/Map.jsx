import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, LayerGroup } from "react-leaflet";
// import { CssVarsProvider } from "@mui/joy/styles";
import { useTheme } from "@mui/joy/styles"; // or @mui/joy/styles if consistent
import { useMediaQuery } from "@mui/material";
import L from "leaflet";
import axios from "axios";
import Navbar from "./header/Navbar";

import Base from "./main/Base";
import Labels from "./main/Labels";
import WeatherLayer from "./main/WeatherLayer";
import ReverseGeocode from "./main/ReverseGeocode";
import ForecastPopup from "./main/ForecastPopup";
import Domain from "./main/Domain";

import DateNavigation from "./bottom/DateNavigation";
import ForecastContainer from "./bottom/ForecastContainer";
import Feedback from "./bottom/Feedback";

import LayerMenu from "./left/LayerMenu";
import ScaleNautic from "react-leaflet-nauticsale";

import MapControl from "./right/MapControl";
import Legend from "./right/Legend";
import Issuance from "./right/Issuance";

import DateSlider from "./bottom/DateSlider";
import ZoomLevel from "./utils/ZoomLevel";

import { Stack, Box, Snackbar } from "@mui/joy";
import { Slide } from "@mui/material";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

const Map = () => {
  const theme = useTheme();
  const isBelowLaptop = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  useEffect(() => {
    document.body.style.overflow = "hidden";
  }, []);

  const [arcgisToken, setArcgisToken] = useState(null);
  const [serverToken, setServerToken] = useState(null);

  useEffect(() => {
    const fetchServerToken = async () => {
      try {
        const response = await axios.get("/serverToken");
        setServerToken(response.data.token);
      } catch (error) {
        console.error("Error fetching server token:", error);
      }
    };
    fetchServerToken();

    const fetchArcgisToken = async () => {
      try {
        const response = await axios.get("/api/token");
        setArcgisToken(response.data.accessToken);
      } catch (error) {
        console.error("Error fetching Arcgis token:", error);
      }
    };

    fetchArcgisToken();
  }, []);

  const bounds = useMemo(
    () =>
      L.latLngBounds([
        [0, 110], // Southwest corner (lat, lng)
        [27, 155], // Northeast corner (lat, lng)
      ]),
    []
  );
  const [location, setLocation] = useState({
    latLng: {},
    municity: "",
    province: "",
  });
  const [isLocationReady, setIsLocationReady] = useState(false);

  const startDate = useRef(null);

  const markerLayer = useRef(null);
  const overlayLayer = useRef(null);
  const selectedPolygon = useRef(null);

  const [map, setMap] = useState(null); // External state for the map instance
  const [open, setOpen] = useState(false); // Slide up bottom container state
  const [date, setDate] = useState(new Date());
  const [dateReady, setDateReady] = useState(false);
  const [overlay, setOverlay] = useState("temperature_mean");
  const [zoomLevel, setZoomLevel] = useState(8);

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [temp, setTemp] = useState("temperature_mean");
  const [activeTooltip, setActiveTooltip] = useState("Temperature");
  const [isDiscrete, setIsDiscrete] = useState(false);
  const [isAnimHidden, setIsAnimHidden] = useState(false);
  const [isLayerClipped, setIsLayerClipped] = useState(false);
  const [isBoundaryHidden, setIsBoundaryHidden] = useState(false);

  const [units, setUnits] = useState({
    temperature: "°C",
    rainfall: "mm/day",
    windSpeed: "m/s",
    windDirection: "arrow",
  });

  const [scale, setScale] = useState({ metric: true, imperial: false });

  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    // Function to fetch data from the API
    const fetchDate = async () => {
      try {
        const response = await axios.get("/api/v1/valid");
        startDate.current = response.data; // Store the fetched data
        const currentDate = new Date();
        const endDate = new Date(startDate.current.latest_date);

        endDate.setDate(endDate.getDate() + 9);
        setDate(currentDate > endDate ? endDate : currentDate);
        setDateReady(true); // Set readiness to true once data is fetched
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchDate();
  }, []);

  const displayMap = useMemo(
    () => (
      <>
        <Navbar
          arcgisToken={arcgisToken}
          map={map}
          markerLayer={markerLayer}
          location={location}
          setLocation={setLocation}
          setOpen={setOpen}
          open={open}
          units={units}
          setUnits={setUnits}
          scale={scale}
          setScale={setScale}
          setIsLocationReady={setIsLocationReady}
          selectedPolygon={selectedPolygon}
        />
        <MapContainer
          ref={setMap}
          center={[13, 122]}
          zoom={!isMobile ? 8 : 6}
          minZoom={5}
          maxZoom={15}
          maxBounds={bounds}
          maxBoundsViscosity={0.5}
          zoomControl={false}
        >
          <ZoomLevel setZoomLevel={setZoomLevel} />
          {isLocationReady ? (
            <ForecastPopup
              location={location}
              markerLayer={markerLayer}
              setLocation={setLocation}
              setOpen={setOpen}
              open={open}
              date={date}
              overlay={overlay}
              units={units}
              setUnits={setUnits}
              selectedPolygon={selectedPolygon}
            />
          ) : null}
          {isBelowLaptop ? null : (
            <ScaleNautic
              metric={scale.metric}
              imperial={scale.imperial}
              nautic={false}
              key={`${scale.metric}-${scale.imperial}`} // Rerender on scale change
            />
          )}

          <LayerGroup ref={markerLayer} />
          <LayerGroup ref={overlayLayer} />
          {dateReady && (
            <WeatherLayer
              startDate={startDate}
              overlay={overlay}
              date={date}
              overlayLayer={overlayLayer}
              isDiscrete={isDiscrete}
              isAnimHidden={isAnimHidden}
              isLayerClipped={isLayerClipped}
              open={open}
              zoomLevel={zoomLevel}
            />
          )}
          <Base arcgisToken={arcgisToken} selectedPolygon={selectedPolygon} />
          <Labels arcgisToken={arcgisToken} />

          <ReverseGeocode
            arcgisToken={arcgisToken}
            setLocation={setLocation}
            setIsLocationReady={setIsLocationReady}
            selectedPolygon={selectedPolygon}
          />
          {dateReady && !isMobile && (
            <Issuance context="laptop" startDate={startDate} />
          )}
          {isBoundaryHidden && <Domain />}
        </MapContainer>

        {!isMobile && (
          <Stack
            spacing={2}
            direction="row"
            sx={{
              justifyContent: "center",
              alignItems: "flex-end",
              position: "absolute",
              bottom: 20,
              zIndex: 1200,
              width: "100%",
              px: 1,
              pointerEvents: "none", //Let clicks pass through by default
            }}
          >
            <Feedback setOpenSnackbar={setOpenSnackbar} />

            <Stack
              direction="column"
              spacing={0}
              sx={{
                ml: 0,
                alignItems: "center",
                justifyContent: "flex-end",
                position: "relative",
                width: "calc(100% - 140px)",
                height: "auto",
                [theme.breakpoints.down("lg")]: {
                  width: "calc(100% - 80px)",
                },
              }}
            >
              {dateReady && (
                <DateNavigation
                  initialDate={new Date(startDate.current.latest_date)}
                  range={10}
                  setDate={setDate}
                  date={date}
                  open={open}
                />
              )}
              <ForecastContainer
                serverToken={serverToken}
                map={map}
                open={open}
                setOpen={setOpen}
                location={location}
                setLocation={setLocation}
                markerLayer={markerLayer}
                overlay={overlay}
                setOverlay={setOverlay}
                setIsMenuOpen={setIsMenuOpen}
                temp={temp}
                setTemp={setTemp}
                setActiveTooltip={setActiveTooltip}
                units={units}
                setUnits={setUnits}
                date={date}
                setDate={setDate}
                isDiscrete={isDiscrete}
                arcgisToken={arcgisToken}
                selectedPolygon={selectedPolygon}
                interactive={false}
                setOpenSnackbar={setOpenSnackbar}
              />
            </Stack>
            <Legend
              overlay={overlay}
              isDiscrete={isDiscrete}
              units={units}
              setUnits={setUnits}
            />
          </Stack>
        )}

        {isMobile && (
          <Stack
            direction={"column"}
            spacing={0}
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1200,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Stack
              direction="column"
              spacing={0}
              sx={{
                ml: 0,
                alignItems: "center",
                justifyContent: "flex-end",
                position: "relative",
                width: "100%",
                height: "auto",
              }}
            >
              {dateReady && (
                <Slide direction="up" in={!open} mountOnEnter unmountOnExit>
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 1200,
                    }}
                  >
                    <DateSlider
                      initialDate={new Date(startDate.current.latest_date)}
                      range={10}
                      setDate={setDate}
                      date={date}
                      open={open}
                    />
                  </Box>
                </Slide>
              )}
              <ForecastContainer
                serverToken={serverToken}
                map={map}
                open={open}
                setOpen={setOpen}
                location={location}
                setLocation={setLocation}
                markerLayer={markerLayer}
                overlay={overlay}
                setOverlay={setOverlay}
                setIsMenuOpen={setIsMenuOpen}
                temp={temp}
                setTemp={setTemp}
                setActiveTooltip={setActiveTooltip}
                units={units}
                setUnits={setUnits}
                date={date}
                setDate={setDate}
                isDiscrete={isDiscrete}
                arcgisToken={arcgisToken}
                selectedPolygon={selectedPolygon}
                interactive={false}
              />
            </Stack>
            {!open && (
              <Legend
                overlay={overlay}
                isDiscrete={isDiscrete}
                units={units}
                setUnits={setUnits}
              />
            )}
          </Stack>
        )}

        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          autoHideDuration={4000}
          open={openSnackbar}
          onClose={(event, reason) => {
            if (reason === "clickaway") {
              return;
            }
            setOpenSnackbar(false);
          }}
          size="md"
          variant="solid"
          color="success"
          sx={{ maxWidth: "350px" }}
          startDecorator={
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ fontSize: "1.5rem" }}
            />
          }
        >
          Submitted successfully. Thank you for helping us improve!
        </Snackbar>

        {!isMobile && <MapControl map={map} />}
        {dateReady && (
          <LayerMenu
            overlay={overlay}
            setOverlay={setOverlay}
            isDiscrete={isDiscrete}
            setIsDiscrete={setIsDiscrete}
            isAnimHidden={isAnimHidden}
            setIsAnimHidden={setIsAnimHidden}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            temp={temp}
            setTemp={setTemp}
            activeTooltip={activeTooltip}
            setActiveTooltip={setActiveTooltip}
            isLayerClipped={isLayerClipped}
            setIsLayerClipped={setIsLayerClipped}
            arcgisToken={arcgisToken}
            setLocation={setLocation}
            map={map}
            setIsLocationReady={setIsLocationReady}
            selectedPolygon={selectedPolygon}
            openContainer={open}
            setOpenContainer={setOpen}
            isBoundaryHidden={isBoundaryHidden}
            setIsBoundaryHidden={setIsBoundaryHidden}
            startDate={startDate}
          />
        )}
      </>
    ),

    [
      map,
      bounds,
      arcgisToken,
      open,
      location,
      dateReady,
      date,
      overlay,
      isDiscrete,
      isAnimHidden,
      isMenuOpen,
      temp,
      activeTooltip,
      isLayerClipped,
      units,
      zoomLevel,
      scale,
      isLocationReady,
      isBelowLaptop,
      isMobile,
      isBoundaryHidden,
      openSnackbar,
    ]
  );

  return <>{displayMap}</>;
};

export default Map;
