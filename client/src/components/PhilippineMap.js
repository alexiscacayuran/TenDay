import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Box } from "@mui/material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as turf from "@turf/turf";
import municities from "../data/municities.json";
import SearchCard from "./SearchCard";

function GetZoom({ setZoomLevel }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoomLevel(map.getZoom());
    },
  });
}

function FlyToFeature(props) {
  const map = useMap();

  useEffect(() => {
    let bounds = [
      116.930117636657, 4.64168888115381, 126.605638820405, 20.9366800806089,
    ];

    if (props.didClear) {
      map.flyToBounds(
        [
          [bounds[1], bounds[0]],
          [bounds[3], bounds[2]],
        ],
        { duration: 1 }
      );
    }

    if (props.province) {
      const filterByProvince = municities.features.filter((feature) => {
        return feature.properties.province === props.province;
      });

      bounds = turf.bbox({
        type: "FeatureCollection",
        features: filterByProvince,
      });

      map.flyToBounds(
        [
          [bounds[1], bounds[0]],
          [bounds[3], bounds[2]],
        ],
        { duration: 1 }
      );
    }
  }, [props.province, props.didClear, map]); // Effect runs only when province changes

  return null;
}

export default function PhilippineMap() {
  //map style
  const baseMapStyle = {
    fillColor: "#187498",
    weight: 1.5,
    color: "#187498",
    fillOpacity: 0.1,
    transition: "0.3s", // Added transition for smooth animation
  };

  const map = useRef(null);
  const bounds = L.latLngBounds([
    [4.64168888115381, 116.930117636657],
    [20.9366800806089, 126.605638820405],
  ]).pad(0.2);
  const [location, setLocation] = useState({ municity: "", province: "" });
  const [didClear, setDidClear] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(5);

  function getFeatureCenter(feature) {
    let maxAreaPolygon = null;
    let maxArea = 0;

    // Handle Polygon or MultiPolygon
    const coordinates = feature.geometry.coordinates;
    const isMultiPolygon = feature.geometry.type === "MultiPolygon";

    if (isMultiPolygon) {
      // Iterate over MultiPolygon
      coordinates.forEach((polyCoords) => {
        polyCoords.forEach((ringCoords) => {
          // Ensure valid polygon
          if (
            ringCoords.length >= 4 &&
            turf.booleanValid(turf.polygon([ringCoords]))
          ) {
            const polygon = turf.polygon([ringCoords]);
            const area = turf.area(polygon);

            if (area > maxArea) {
              maxArea = area;
              maxAreaPolygon = polygon;
            }
          }
        });
      });
    } else {
      // Handle simple Polygon
      coordinates.forEach((ringCoords) => {
        if (
          ringCoords.length >= 4 &&
          turf.booleanValid(turf.polygon([ringCoords]))
        ) {
          const polygon = turf.polygon([ringCoords]);
          const area = turf.area(polygon);

          if (area > maxArea) {
            maxArea = area;
            maxAreaPolygon = polygon;
          }
        }
      });
    }

    // Compute the center of mass of the largest polygon
    const center = turf.centerOfMass(maxAreaPolygon);
    return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
  }

  function onEachMunicity(municity, layer) {
    // Hover animation effect for all features
    layer.on({
      add: () => {
        // Shows name for each municities
        if (zoomLevel > 10 && location.province) {
          const municityName = layer.feature.properties.municity;
          const featureCenter = getFeatureCenter(layer.feature);

          // Bind tooltip at the computed center of mass
          if (featureCenter) {
            layer.bindTooltip(municityName, {
              className: "tooltip-municity-name",
              permanent: true,
              direction: "center",
              interactive: true,
            });
            layer.openTooltip(featureCenter);
          }
        }
      },
      click: () => {
        const municitySelected = municity.properties.municity;
        const provinceSelected = municity.properties.province;

        // Check if the municity has changed
        if (municitySelected === location.municity) {
          // If the municity is the same, do nothing
          return;
        }

        // Set the current layer as selected
        layer.setStyle({ fillOpacity: 0.5 });

        setLocation({
          province: provinceSelected,
          municity: municitySelected,
        }); // Set location to selected municity and province

        if (map) {
          // Get bounds for the selected feature
          const bounds = turf.bbox(layer.feature);
          const latLngBounds = [
            [bounds[1], bounds[0]], // SW corner
            [bounds[3], bounds[2]], // NE corner
          ];
          console.log(map);
          // Fit the map to the bounds of the clicked feature
          map.current.fitBounds(latLngBounds, {
            padding: [50, 50],
            maxZoom: zoomLevel,
          });
        }
      },
      mouseover: () => {
        layer.setStyle({ weight: 3 }); // Highlight border on hover
      },
      mouseout: () => {
        layer.setStyle({ weight: 1.5 }); // Reset border when not hovering
      },
    });

    // Apply additional style to the selected municity
    if (municity.properties.municity === location.municity) {
      layer.setStyle({ fillOpacity: 0.5 }); // Highlight selected municity
    } else {
      layer.setStyle(baseMapStyle); // Default style for other municities
    }
  }

  //filter the list of municities depending on the selected province
  function filterByProvince(municity) {
    if (location.province) {
      if (municity.properties.province === location.province) {
        return true;
      }
    } else {
      // If province is not selected, show all
      return true;
    }
  }

  const displayMap = useMemo(
    () => (
      <div>
        <MapContainer
          ref={map}
          center={[13, 122]}
          zoom={6}
          minZoom={6}
          maxZoom={12}
          maxBounds={bounds}
          zoomControl={false}
          whenReady={(event) => {
            map.current = event.target;
          }}
        >
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          />

          {/* Set key to force render geojson every user input for province */}
          <GeoJSON
            key={location.province + location.municity + zoomLevel}
            data={municities.features}
            style={baseMapStyle}
            onEachFeature={onEachMunicity}
            filter={filterByProvince}
          />

          <ZoomControl position="topright" />
          <FlyToFeature province={location.province} didClear={didClear} />
          <GetZoom setZoomLevel={setZoomLevel} />
        </MapContainer>

        <Box sx={{ position: "fixed", top: "10px" }}>
          <SearchCard
            setLocation={setLocation}
            setDidClear={setDidClear}
            location={location}
          />
        </Box>
      </div>
    ),
    [location, zoomLevel, didClear]
  );

  return <div>{displayMap}</div>;
}
