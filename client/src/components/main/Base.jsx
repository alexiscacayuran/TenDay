import { useEffect, useState, useRef } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { featureLayer } from "esri-leaflet";
import { useMap } from "react-leaflet";
import L from "leaflet";

const Base = ({ arcgisToken, selectedPolygon }) => {
  const map = useMap();
  const [provinceId, setProvinceId] = useState(null);
  const municityLayerRef = useRef(null);
  const weatherBasemapEnum = "8ece66cf764742f7ba0f3006481a7b75";
  const hilshadeEnum = "74463549688e4bb48092df8e5c789fd0";

  map.createPane("activeFeaturePane");
  map.getPane("activeFeaturePane").style.zIndex = 500;

  useEffect(() => {
    if (!arcgisToken) return;

    map.createPane("hillshadePane");
    map.getPane("hillshadePane").style.zIndex = 250;

    const weatherBasemap = vectorBasemapLayer(weatherBasemapEnum, {
      apiKey: arcgisToken,
      pane: "overlayPane",
      zIndex: 200,
    });
    weatherBasemap.addTo(map);

    const provinceBoundaries = featureLayer({
      token: arcgisToken,
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
          mouseover: () => {
            setProvinceId(feature.properties.ID);
          },
        });
      },
    });

    provinceBoundaries.addTo(map);

    const hillshade = vectorBasemapLayer(hilshadeEnum, {
      apiKey: arcgisToken,
      pane: "hillshadePane",
    });
    hillshade.addTo(map);

    map.attributionControl.setPrefix(false);
    map.attributionControl.setPosition("bottomleft");

    return () => {
      map.removeLayer(weatherBasemap);
      map.removeLayer(provinceBoundaries);
    };
  }, [map, arcgisToken]);

  useEffect(() => {
    if (!provinceId) return;

    const where = `ID LIKE '${provinceId}%'`;

    // Remove previous layer if exists
    if (municityLayerRef.current) {
      map.removeLayer(municityLayerRef.current);
    }
    const municityBoundaries = featureLayer({
      token: arcgisToken,
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2022/FeatureServer/3",
      simplifyFactor: 0.5,
      precision: 4,
      where: where,
      style: (feature) => ({
        color: "white",
        weight: 2.5,
        opacity: 0.5,
        fillOpacity: 0.2,
        weight: 3,
        stroke: true,
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: () => {
            setProvinceId(feature.properties.ID.substring(0, 4));
            layer.setStyle({
              fillColor: "white",
              fillOpacity: 0.4,
            });
          },

          mouseout: () => {
            setProvinceId(null);
            layer.setStyle({
              fillColor: "white",
              fillOpacity: 0.2,
            });
          },

          click: (event) => {
            const clickedFeature = event.target.feature;

            if (selectedPolygon.current) {
              map.removeLayer(selectedPolygon.current);
            }

            const selectedMunicity = L.geoJSON(clickedFeature, {
              style: {
                color: "#3E7BFF",
                weight: 3,
                opacity: 1,
                fillColor: "#3E7BFF",
                fillOpacity: 0.3,
                interactive: false,
                pane: "activeFeaturePane",
              },
            });

            selectedMunicity.addTo(map);
            selectedPolygon.current = selectedMunicity;
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
  }, [map, arcgisToken, provinceId]);

  return null;
};

export default Base;
