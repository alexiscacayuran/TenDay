import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, LayerGroup } from "react-leaflet";
import { CssVarsProvider } from "@mui/joy/styles";
import theme from "../theme";
import useResponsiveCheck from "../hooks/useResponsiveCheck";

import L from "leaflet";
import axios from "axios";
import MapControl from "./MapControl";
import Base from "./Base";
import Labels from "./Labels";
import ReverseGeocode from "./ReverseGeocode";
import DateNavigation from "./DateNavigation";
import Navbar from "./Navbar";
import ForecastContainer from "./ForecastContainer";
import LayerMenu from "./LayerMenu";
import WeatherLayer from "./WeatherLayer";
import Legend from "./Legend";
import ZoomLevel from "./ZoomLevel";
import ScaleNautic from "react-leaflet-nauticsale";
import ForecastPopup from "./ForecastPopup";
import Issuance from "./Issuance";

import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";

const Map = () => {
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

  const [units, setUnits] = useState({
    temperature: "°C",
    rainfall: "mm/day",
    windSpeed: "m/s",
    windDirection: "arrow",
  });

  const [scale, setScale] = useState({ metric: true, imperial: false });

  useEffect(() => {
    // Function to fetch data from the API
    const fetchDate = async () => {
      try {
        const response = await axios.get("/valid");
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
  }, []); //

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
          center={[13, 122]}
          zoom={8}
          minZoom={5}
          maxZoom={20}
          maxBounds={bounds}
          maxBoundsViscosity={0.5}
          zoomControl={false}
          ref={setMap} // Set map instance to external state
          paddingTopLeft={[2, 2]}
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
          <ScaleNautic
            metric={scale.metric}
            imperial={scale.imperial}
            nautic={false}
            key={`${scale.metric}-${scale.imperial}`} // Rerender on scale change
          />

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
        </MapContainer>
        <CssVarsProvider theme={theme}>
          <Stack
            spacing={2}
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-end",
              position: "absolute",
              bottom: 20,
              zIndex: 1200,
              width: "100%",
              px: 1,
              pointerEvents: "none", //Let clicks pass through by default
            }}
          >
            <Box
              sx={{
                minWidth: "100px",

                flexShrink: 0,
              }}
            ></Box>
            <Stack
              direction="column"
              sx={{
                alignItems: "center",
                justifyContent: "flex-end",
                position: "relative",
                width: "calc(100% - 180px)",
                height: "auto",
                [theme.breakpoints.down("laptop")]: {
                  width: "100%",
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
              />
            </Stack>

            <Legend
              overlay={overlay}
              isDiscrete={isDiscrete}
              units={units}
              setUnits={setUnits}
            />
          </Stack>
        </CssVarsProvider>

        {dateReady && <Issuance startDate={startDate} />}

        <MapControl map={map} />
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
        />
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
    ]
  );

  return <>{displayMap}</>;
};

export default Map;
