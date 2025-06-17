import { useEffect, useState, useRef } from "react";
import { vectorBasemapLayer } from "esri-leaflet-vector";
import { featureLayer } from "esri-leaflet";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMediaQuery } from "@mui/material";

const Base = ({ arcgisToken, selectedPolygon }) => {
  const map = useMap();
  const [provinceId, setProvinceId] = useState(null);
  const [showMunicity, setShowMunicity] = useState(false);
  const municityLayerRef = useRef(null);
  const weatherBasemapEnum = "8ece66cf764742f7ba0f3006481a7b75";
  const hilshadeEnum = "74463549688e4bb48092df8e5c789fd0";

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  map.createPane("activeFeaturePane");
  map.getPane("activeFeaturePane").style.zIndex = 400;

  useEffect(() => {
    if (!arcgisToken) return;

    map.createPane("hillshadePane");
    map.getPane("hillshadePane").style.zIndex = 250;

    const weatherBasemap = vectorBasemapLayer(weatherBasemapEnum, {
      apiKey: arcgisToken,
      pane: "overlayPane",
      zIndex: 200,
    }).addTo(map);

    const provinceBoundaries = featureLayer({
      token: arcgisToken,
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2022/FeatureServer/2",
      simplifyFactor: 0.5,
      precision: 4,
      style: () => ({
        color: "white",
        weight: 3,
        opacity: 0.5,
        fillOpacity: 0,
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: () => {
            if (!isMobile) {
              setProvinceId(feature.properties.ID);
            }
          },
        });
      },
    }).addTo(map);

    const hillshade = vectorBasemapLayer(hilshadeEnum, {
      apiKey: arcgisToken,
      pane: "hillshadePane",
    }).addTo(map);

    map.attributionControl.setPrefix(false);
    map.attributionControl.setPosition("bottomleft");

    return () => {
      map.removeLayer(weatherBasemap);
      map.removeLayer(provinceBoundaries);
      map.removeLayer(hillshade);
    };
  }, [map, arcgisToken, isMobile]);

  // Mobile-specific map zoom event
  useMapEvents({
    zoomend: () => {
      if (isMobile) {
        const currentZoom = map.getZoom();
        setShowMunicity(currentZoom >= 10);
      }
    },
  });

  useEffect(() => {
    if (!arcgisToken || (!provinceId && !isMobile)) return;

    if (municityLayerRef.current) {
      map.removeLayer(municityLayerRef.current);
    }

    // On mobile: only show if zoom is sufficient
    if (isMobile && !showMunicity) return;

    const whereClause = isMobile ? "1=1" : `ID LIKE '${provinceId}%'`;

    const municityBoundaries = featureLayer({
      token: arcgisToken,
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2022/FeatureServer/3",
      simplifyFactor: 0.5,
      precision: 4,
      where: whereClause,
      style: () => ({
        color: "white",
        weight: 3,
        opacity: 0.5,
        fillOpacity: isMobile ? 0 : 0.2,
      }),
      onEachFeature: (feature, layer) => {
        // Always add click event (for both mobile and desktop)
        layer.on({
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
                fillOpacity: 0.2,
                interactive: false,
                pane: "activeFeaturePane",
              },
            });

            selectedMunicity.addTo(map);
            selectedPolygon.current = selectedMunicity;
          },
        });

        // Only add mouseover/mouseout on non-mobile
        if (!isMobile) {
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
          });
        }
      },
    });

    municityBoundaries.addTo(map);
    municityLayerRef.current = municityBoundaries;

    return () => {
      if (map.hasLayer(municityBoundaries)) {
        map.removeLayer(municityBoundaries);
      }
    };
  }, [map, arcgisToken, provinceId, isMobile, showMunicity]);

  return null;
};

export default Base;
