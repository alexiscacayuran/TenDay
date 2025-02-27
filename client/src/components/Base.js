import { useEffect } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { useMap } from "react-leaflet";

const Base = ({ accessToken }) => {
  const map = useMap();
  const weatherBasemapEnum = "8ece66cf764742f7ba0f3006481a7b75";

  useEffect(() => {
    const weatherBasemap = vectorBasemapLayer(weatherBasemapEnum, {
      token: accessToken,
      pane: "overlayPane",
      zIndex: 200,
    });
    weatherBasemap.addTo(map);

    return () => {
      map.removeLayer(weatherBasemap);
    };
  }, [map, accessToken]);

  return null;
};

export default Base;
