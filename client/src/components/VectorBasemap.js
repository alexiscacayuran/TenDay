import { useEffect } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { useMap } from "react-leaflet";

const VectorBasemap = ({ basemap, accessToken }) => {
  const map = useMap();

  useEffect(() => {
    const vectorLayer = vectorBasemapLayer(basemap, {
      token: accessToken,
    });
    vectorLayer.addTo(map);

    return () => {
      map.removeLayer(vectorLayer);
    };
  }, [map, basemap, accessToken]);

  return null;
};

export default VectorBasemap;
