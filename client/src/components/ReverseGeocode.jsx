import React, { useState } from "react";
import { reverseGeocode } from "esri-leaflet-geocoder";
import { useMapEvents, useMap } from "react-leaflet";
import ForecastPopup from "./ForecastPopup";

const ReverseGeocode = ({
  arcgisToken,
  setLocation,
  setIsLocationReady,
  selectedPolygon,
}) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      // if (selectedPolygon.current) {
      //   map.removeLayer(selectedPolygon.current);
      // }
      const { latlng } = e;

      setIsLocationReady(false);

      // Perform reverse geocoding
      reverseGeocode({
        apikey: arcgisToken,
      })
        .latlng(latlng)
        .run((error, result) => {
          if (error) {
            console.error("Geocoding error:", error);
            return;
          }

          // console.log(result);

          setLocation({
            latLng: result.latlng,
            municity: result.address.City,
            province: result.address.Subregion,
          });
          setIsLocationReady(true);
        });
    },
  });

  return null;
};

export default ReverseGeocode;
