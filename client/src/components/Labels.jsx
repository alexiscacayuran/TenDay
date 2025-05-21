import { useEffect } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { useMap } from "react-leaflet";

const Labels = ({ arcgisToken }) => {
  const map = useMap();
  const labelsEnum = "arcgis/light-gray/labels";

  useEffect(() => {
    if (!arcgisToken) return;

    const labels = vectorBasemapLayer(labelsEnum, {
      token: arcgisToken,
    });

    labels.addTo(map);

    return () => {
      map.removeLayer(labels);
    };
  }, [map, arcgisToken]);

  return null;
};

export default Labels;
