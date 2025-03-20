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
  overlay,
  units,
  setUnits,
}) => {
  const markerRef = useRef(null);
  const [forecast, setForecast] = useState({});
  const [loading, setLoading] = useState(true);
  const [forecastRetrieval, setForecastRetrieval] = useState(false);

  useEffect(() => {
    if (markerRef.current && markerLayer.current) {
      markerLayer.current.clearLayers();
      markerLayer.current.addLayer(markerRef.current);
    }
  }, [markerRef, markerLayer]);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setForecastRetrieval(false);
        setLoading(true);
        const response = await axios.get("/date", {
          params: {
            municity: location.municity,
            province: location.province,
            date: date,
          },
        });
        setForecast(response.data);
        setLoading(false);
        setForecastRetrieval(true);
      } catch (error) {
        console.error("Error fetching forecast:", error);
        setForecast(null);
        setLoading(false);
        setForecastRetrieval(false);
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
    <Marker
      ref={markerRef}
      position={location.latLng}
      icon={markerIcon}
      eventHandlers={{
        add: !openContainer ? (e) => e.target.openPopup() : () => {},
        click: openContainer ? (e) => e.target.closePopup() : () => {},
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
          forecastRetrieval={forecastRetrieval}
          loading={loading}
          units={units}
          setUnits={setUnits}
        />
      </Popup>
    </Marker>
  );
};

export default ForecastPopup;
