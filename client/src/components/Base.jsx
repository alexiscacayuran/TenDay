import { useEffect, useState, useRef } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { featureLayer } from "esri-leaflet";
import { useMap } from "react-leaflet";
import L from "leaflet";

const Base = ({ accessToken, selectedMunicityRef }) => {
  const map = useMap();
  const weatherBasemapEnum = "8ece66cf764742f7ba0f3006481a7b75";
  // const hilshadeEnum = "74463549688e4bb48092df8e5c789fd0";
  const [provinceId, setProvinceId] = useState(null);

  const municityLayerRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

    const weatherBasemap = vectorBasemapLayer(weatherBasemapEnum, {
      apiKey: accessToken,
      pane: "overlayPane",
      zIndex: 200,
    });
    weatherBasemap.addTo(map);

    const provinceBoundaries = featureLayer({
      token: accessToken,
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2022/FeatureServer/2",
      simplifyFactor: 0.5,
      precision: 4,
      style: (feature) => ({
        color: "white",
        weight: 2.5,
        opacity: 0.5,
        fillOpacity: 0,
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mousemove: () => {
            setProvinceId(feature.properties.ID);
          },
        });
      },
    });

    provinceBoundaries.addTo(map);

    // const hillshade = vectorBasemapLayer(hilshadeEnum, {
    //   token: accessToken,

    //   zIndex: 200,
    // });
    // hillshade.addTo(map);

    map.attributionControl.setPrefix(false);
    map.attributionControl.setPosition("bottomleft");

    return () => {
      map.removeLayer(weatherBasemap);
      map.removeLayer(provinceBoundaries);
    };
  }, [map, accessToken]);

  useEffect(() => {
    if (!provinceId) return;

    // const selectedMunicityID =
    //   selectedMunicityRef.current?.getLayers?.()?.[0]?.feature?.properties?.ID;

    const where = `ID LIKE '${provinceId}%'`;

    // Remove previous layer if exists
    if (municityLayerRef.current) {
      map.removeLayer(municityLayerRef.current);
    }
    const municityBoundaries = featureLayer({
      token: accessToken,
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2022/FeatureServer/3",
      simplifyFactor: 0.5,
      precision: 4,
      where: where,
      style: (feature) => ({
        color: "white",
        weight: 2.5,
        opacity: 0.5,
        fillOpacity: 0.3,
        weight: 3,
        stroke: true,
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: () => {
            layer.setStyle({
              fillColor: "#3E7BFF",
            });
          },
          mouseout: () => {
            layer.setStyle({
              fillColor: "white",
            });
          },
          click: (event) => {
            const clickedFeature = event.target.feature;
            console.log("Clicked feature", event.target);

            // Remove previous selected layer if it exists
            if (selectedMunicityRef.current) {
              map.removeLayer(selectedMunicityRef.current);
            }

            // Create new GeoJSON layer from the clicked feature
            const selectedMunicity = L.geoJSON(clickedFeature, {
              style: {
                color: "#3E7BFF",
                weight: 3,
                opacity: 1,
                fillColor: "#3E7BFF",
                fillOpacity: 0.3,
              },
            });

            selectedMunicity.addTo(map);
            selectedMunicityRef.current = selectedMunicity;
          },
        });
      },
    });

    municityBoundaries.addTo(map);
    municityLayerRef.current = municityBoundaries;

    return () => {
      if (map.hasLayer(municityBoundaries)) {
        map.removeLayer(municityBoundaries);
      }
    };
  }, [map, accessToken, provinceId]);

  return null;
};

export default Base;
