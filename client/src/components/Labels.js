import { useEffect } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { useMap } from "react-leaflet";

const Labels = ({ accessToken }) => {
  const map = useMap();
  const labelsEnum = "arcgis/light-gray/labels";
  const hillshadeEnum = "74463549688e4bb48092df8e5c789fd0";

  useEffect(() => {
    if (!accessToken) return;

    console.log("Using accessToken in Labels:", accessToken);

    const labels = vectorBasemapLayer(labelsEnum, {
      token: accessToken,
    });

    labels.addTo(map);
    // const hillshade = vectorBasemapLayer(hillshadeEnum, {
    //   token: accessToken,
    // });
    // hillshade.addTo(map);

    return () => {
      map.removeLayer(labels);
      // map.removeLayer(hillshade);
    };
  }, [map, accessToken]);

  return null;
};

export default Labels;
