import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Popup, Marker, useMap } from "react-leaflet";
import { DivIcon } from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "../styles.css";
import PopupContent from "./PopupContent";

const ForecastPopup = ({
  location,
  markerLayer,
  setOpen,
  open,
  date,
  overlay,
  units,
  setUnits,
  selectedPolygon,
}) => {
  const map = useMap();
  const markerRef = useRef(null);
  const [forecast, setForecast] = useState({});
  const [loading, setLoading] = useState(true);
  const [forecastRetrieval, setForecastRetrieval] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape") {
        if (markerLayer.current && markerRef.current) {
          markerLayer.current.removeLayer(markerRef.current);
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [markerLayer, markerRef]);

  useEffect(() => {
    if (markerRef.current && markerLayer.current) {
      markerLayer.current.clearLayers();
      markerLayer.current.addLayer(markerRef.current);
    }
  }, [markerRef, markerLayer]);

  useEffect(() => {
    if (location.municity === "" && location.province === "") {
      setLoading(false);
      return;
    }

    const fetchForecast = async () => {
      try {
        setForecastRetrieval(false);
        setLoading(true);
        const response = await axios.get("/dateInternal", {
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
    if (selectedPolygon.current) {
      map.removeLayer(selectedPolygon.current);
      selectedPolygon.current = null;
    }
  }, [markerLayer, selectedPolygon, map]);

  const markerIcon = useMemo(
    () =>
      open
        ? new DivIcon({ className: "pulsating-marker" })
        : new DivIcon({
            className: "regular-marker",
            iconAnchor: [6, 8],
            popupAnchor: [0, -8],
          }),
    [open]
  );

  return (
    <Marker
      ref={markerRef}
      position={location.latLng}
      icon={markerIcon}
      interactive={false}
      eventHandlers={{
        add: !open ? (e) => e.target.openPopup() : () => {},
        click: open ? (e) => e.target.closePopup() : () => {},
      }}
    >
      <Popup
        offset={[0, -30]}
        minWidth="320"
        onClose={handlePopupClose}
        closeButton={false}
        autoPanPaddingTopLeft={[200, 80]}
        autoPanPaddingBottomRight={[70, 80]}
      >
        <PopupContent
          forecast={forecast}
          setOpen={setOpen}
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
