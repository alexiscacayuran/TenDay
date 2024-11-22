import axios from "axios";
import { useState } from "react";
// import L from "leaflet";
import { reverseGeocode } from "esri-leaflet-geocoder";
import { useMapEvents } from "react-leaflet";
import ForecastPopup from "./ForecastPopup";

const ReverseGeocode = ({
  accessToken,
  location,
  setLocation,
  layerGroup,
  setOpenContainer,
  openContainer,
}) => {
  const [forecast, setForecast] = useState({});
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

          console.log(result);

          // // Clear previous markers and add a new marker at clicked location
          // layerGroup.current.clearLayers();
          setIsForecastReady(false); // Reset forecast readiness on new click

          setLocation({
            latLng: result.latlng,
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
    <ForecastPopup
      forecast={forecast}
      location={location}
      layerGroup={layerGroup}
      setOpenContainer={setOpenContainer}
      openContainer={openContainer}
    />
  ) : null;
};

export default ReverseGeocode;
