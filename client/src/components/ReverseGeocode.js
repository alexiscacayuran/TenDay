import axios from "axios";
import { useState } from "react";
// import L from "leaflet";
import { reverseGeocode } from "esri-leaflet-geocoder";
import ForecastTooltip from "./ForecastTooltip";
import { useMapEvents } from "react-leaflet";

const ReverseGeocode = ({ accessToken, setLocation, layerGroup }) => {
  const [forecast, setForecast] = useState({});
  const [position, setPosition] = useState(null);
  const [isForecastReady, setIsForecastReady] = useState(false); // Track forecast readiness

  useMapEvents({
    click(e) {
      const { latlng } = e;

      // Perform reverse geocoding
      reverseGeocode({
        apikey: accessToken,
      })
        .latlng(latlng)
        .run((error, result) => {
          if (error) {
            console.error("Geocoding error:", error);
            return;
          }

          // // Clear previous markers and add a new marker at clicked location
          // layerGroup.current.clearLayers();

          setPosition(result.latlng);
          setIsForecastReady(false); // Reset forecast readiness on new click

          setLocation({
            municity: result.address.City,
            province: result.address.Subregion,
          });

          // Fetch forecast data based on geocoded location
          axios
            .get("/current", {
              params: {
                municity: result.address.City,
                province: result.address.Subregion,
              },
            })
            .then((res) => {
              setForecast(res.data);
              setIsForecastReady(true); // Set forecast readiness after data is updated
            })
            .catch((error) => {
              console.error(error);
              setForecast(null);
              setIsForecastReady(true); // Set forecast readiness after data is updated
            });
        });
    },
  });

  // Render the ForecastTooltip only when isForecastReady is true
  return isForecastReady ? (
    <ForecastTooltip
      forecast={forecast}
      position={position}
      layerGroup={layerGroup}
    />
  ) : null;
};

export default ReverseGeocode;
