import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import axios from "axios";
import { Box } from "@mui/material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { bbox } from "@turf/bbox";
import municities from "../data/municities.json";
import SearchCard from "./SearchCard";

function GetZoom({ setZoomLevel }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoomLevel(map.getZoom());
    },
  });
}

function FlyToFeature({province, didClear}) {
  const map = useMap();

  useEffect(() => {
    let bounds = [
      116.930117636657, 4.64168888115381, 126.605638820405, 20.9366800806089,
    ];

    if (didClear) {
      map.flyToBounds(
        [
          [bounds[1], bounds[0]],
          [bounds[3], bounds[2]],
        ],
        { duration: 1 }
      );
    }

    if (province) {
      const filterByProvince = municities.features.filter((feature) => {
        return feature.properties.province === province;
      });

      bounds = bbox({
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
  }, [province, didClear, map]); // Effect runs only when province changes

  return null;
}

export default function PhilippineMap() {
  const baseMapStyle = useMemo(
    () => ({
      fillColor: "#187498",
      weight: 1.5,
      color: "#187498",
      fillOpacity: 0.1,
      transition: "0.3s",
    }),
    []
  );

  const map = useRef(null);
  const bounds = useMemo(
    () =>
      L.latLngBounds([
        [4.64, 116.93],
        [20.94, 126.61],
      ]).pad(0.2),
    []
  );
  const [location, setLocation] = useState({ municity: "", province: "" });
  const [didClear, setDidClear] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(5);

  const [currentForecast, setCurrentForecast] = useState({});

  // Pan to feature on location change
  useEffect(() => {
    if (location.municity && map.current) {
      const selectedFeature = municities.features.find(
        (feature) =>
          feature.properties.municity === location.municity &&
          feature.properties.province === location.province
      );

      if (selectedFeature) {
        const bounds = bbox(selectedFeature);
        const latLngBounds = [
          [bounds[1], bounds[0]], // SW corner
          [bounds[3], bounds[2]], // NE corner
        ];

        // Fit the map to the bounds of the selected feature
        map.current.fitBounds(latLngBounds, {
          padding: [50, 50],
          maxZoom: zoomLevel < 9 ? 10 : zoomLevel,
        });
      }
    }

    axios.get('/current', {
      params:{
        municity: location.municity,
        province: location.province
      }
    }).then((res) =>{
      setCurrentForecast(res.data);
    }).catch((error)=>{
      console.log(error)
    })

  }, [location.municity, location.province]);

  const onEachMunicity = useCallback((municity, layer) => {
    layer.on({
      add: () => {
        // Shows name for each municities
        if (zoomLevel > 10 && location.province) {
          const municityName = layer.feature.properties.municity;
          const featureCenter = layer.feature.center;
        
          layer.bindTooltip(municityName, {
            className: "tooltip-municity-name",
            permanent: true,
            direction: "center",
            interactive: true,
          }).openTooltip(featureCenter);
          // Bind tooltip at the center of mass 
          
          
        }
      },
      click: () => {
        const { municity: selectedMunicity, province: selectedProvince } = municity.properties;

        //do nothing if same municity is clicked
        if (selectedMunicity === location.municity) return;

        layer.setStyle({ fillOpacity: 0.5 });
        setLocation({ province: selectedProvince, municity: selectedMunicity });
      },
      // Hover animation effect for all features
      mouseover: () => {
        layer.setStyle({ weight: 3 }); // Highlight border on hover
      },
      mouseout: () => {
        layer.setStyle({ weight: 1.5 }); // Reset border when not hovering
      },
    });

    // Apply additional style to the selected municity
      layer.setStyle(
        municity.properties.municity === location.municity
          ? { fillOpacity: 0.5 }
          : baseMapStyle
      );
    }, [location.municity, location.province, baseMapStyle, zoomLevel]
    )
  

  //filter the list of municities depending on the selected province
  const filterByProvince = useCallback(
    (municity) =>
      //if province is not selected, show all or filter if province is selected
      !location.province ||
      municity.properties.province === location.province,
    [location.province]
  );

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
    [location, zoomLevel, didClear, bounds, baseMapStyle, filterByProvince, onEachMunicity]
  );

  return <div>{displayMap}</div>;
}
