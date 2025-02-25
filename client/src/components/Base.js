import { useEffect } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { useMap } from "react-leaflet";

const Basemap = ({ basemap, accessToken }) => {
  const map = useMap();

  useEffect(() => {
    const vectorLayer = vectorBasemapLayer(basemap, {
      token: accessToken,
      pane: "overlayPane",
      zIndex: 200,
    });
    vectorLayer.addTo(map);

    return () => {
      map.removeLayer(vectorLayer);
    };
  }, [map, basemap, accessToken]);

  return null;
};

export default Basemap;
