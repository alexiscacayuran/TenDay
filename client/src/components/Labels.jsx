import { useEffect } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { useMap } from "react-leaflet";

const Labels = ({ arcgisToken }) => {
  const map = useMap();
  const labelsEnum = "arcgis/light-gray/labels";
  const hillshadeEnum = "74463549688e4bb48092df8e5c789fd0";

  useEffect(() => {
    if (!arcgisToken) return;

    const labels = vectorBasemapLayer(labelsEnum, {
      token: arcgisToken,
    });

    labels.addTo(map);
    // const hillshade = vectorBasemapLayer(hillshadeEnum, {
    //   token: arcgisToken,
    // });
    // hillshade.addTo(map);

    return () => {
      map.removeLayer(labels);
      // map.removeLayer(hillshade);
    };
  }, [map, arcgisToken]);

  return null;
};

export default Labels;
