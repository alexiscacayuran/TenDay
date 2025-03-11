import React, { useState } from "react";
import { reverseGeocode } from "esri-leaflet-geocoder";
import { useMapEvents } from "react-leaflet";
import ForecastPopup from "./ForecastPopup";

const ReverseGeocode = ({
  accessToken,
  location,
  setLocation,
  markerLayer,
  setOpenContainer,
  openContainer,
  date,
  overlay,
}) => {
  const [isLocationReady, setIsLocationReady] = useState(false);

  // Map event handling
  useMapEvents({
    click(e) {
      const { latlng } = e;

      setIsLocationReady(false);

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

          console.log(result.address);

          setLocation({
            latLng: result.latlng,
            municity: result.address.City,
            province: result.address.Subregion,
          });
          setIsLocationReady(true);
        });
    },
  });

  return (
    isLocationReady && (
      <ForecastPopup
        location={location}
        markerLayer={markerLayer}
        setLocation={setLocation}
        setOpenContainer={setOpenContainer}
        openContainer={openContainer}
        date={date}
        isLocationReady={isLocationReady}
        overlay={overlay} // Pass the updated overlay value
      />
    )
  );

  // Render the ForecastPopup only when location is ready
};

export default ReverseGeocode;
