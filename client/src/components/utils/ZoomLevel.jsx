import React from "react";
import { useMapEvents } from "react-leaflet";

const ZoomLevel = ({ setZoomLevel }) => {
  useMapEvents({
    zoomend: (e) => {
      setZoomLevel(e.target.getZoom());
    },
  });

  return null;
};

export default ZoomLevel;
