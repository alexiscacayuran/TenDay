import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Popup, Marker } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import axios from "axios";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import "leaflet/dist/leaflet.css";
import "../styles.css";
import PopupContent from "./PopupContent";

const ForecastPopup = ({
  location,
  layerGroup,
  setOpenContainer,
  openContainer,
  date,
  isLocationReady,
  overlay,
}) => {
  console.log(layerGroup);
  const markerRef = useRef(null);
  const [forecast, setForecast] = useState({});
  const [isForecastReady, setIsForecastReady] = useState(false);

  useEffect(() => {
    if (markerRef.current && layerGroup.current) {
      const leafletMarker = markerRef.current;
      layerGroup.current.clearLayers();
      layerGroup.current.addLayer(leafletMarker);
    }
  }, [markerRef, layerGroup]);

  useEffect(() => {
    if (!location || !date) return;

    setIsForecastReady(false);
    const fetchForecast = async () => {
      try {
        const response = await axios.get("/date", {
          params: {
            municity: location.municity,
            province: location.province,
            date: date,
          },
        });
        setForecast(response.data);
        setIsForecastReady(true);
      } catch (error) {
        console.error("Error fetching forecast:", error);
        setForecast(null);
        setIsForecastReady(true);
      }
    };

    fetchForecast();
  }, [location, date]);

  const handlePopupClose = useCallback(() => {
    if (layerGroup.current && markerRef.current) {
      layerGroup.current.removeLayer(markerRef.current);
    }
  }, [layerGroup]);

  const markerIcon = useMemo(
    () =>
      openContainer
        ? new DivIcon({ className: "pulsating-marker" })
        : new DivIcon({ className: "regular-marker" }),
    [openContainer]
  );

  return (
    isLocationReady && (
      <Marker
        ref={markerRef}
        position={location.latLng}
        icon={markerIcon}
        eventHandlers={{
          add: !openContainer && ((e) => e.target.openPopup()),
          click: openContainer && ((e) => e.target.closePopup()),
        }}
      >
        <Popup
          offset={[0, -30]}
          minWidth="320"
          onClose={handlePopupClose}
          closeButton={false}
        >
          <PopupContent
            forecast={forecast}
            setOpenContainer={setOpenContainer}
            layerGroup={layerGroup}
            markerRef={markerRef}
            handlePopupClose={handlePopupClose}
            overlay={overlay}
          />
        </Popup>
      </Marker>
    )
  );
};

export default ForecastPopup;
