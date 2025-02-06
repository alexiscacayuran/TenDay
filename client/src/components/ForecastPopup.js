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
  markerLayer,
  setOpenContainer,
  openContainer,
  date,
  isLocationReady,
  overlay,
}) => {
  const markerRef = useRef(null);
  const [forecast, setForecast] = useState({});
  const [isForecastReady, setIsForecastReady] = useState(false);

  useEffect(() => {
    if (markerRef.current && markerLayer.current) {
      const leafletMarker = markerRef.current;
      markerLayer.current.clearLayers();
      markerLayer.current.addLayer(leafletMarker);
    }
  }, [markerRef, markerLayer]);

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
    if (markerLayer.current && markerRef.current) {
      markerLayer.current.removeLayer(markerRef.current);
    }
  }, [markerLayer]);

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
            markerLayer={markerLayer}
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
