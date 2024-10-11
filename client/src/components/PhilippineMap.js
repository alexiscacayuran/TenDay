import React, { useEffect, useState } from "react";
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
import municities from "../data/municities.json";
import SearchCard from "./SearchCard";
import { center } from "@turf/center";
import { bbox } from "@turf/bbox";

function GetZoom(props) {
  const map = useMapEvents({
    zoomend: () => {
      props.setZoomLevel(map.getZoom());
    },
  });
}

// function ZoomToFeature(props) {
//   const map = useMap();
//   const location = props.location;
// }

export default function PhilippineMap() {
  //map style
  const mapStyle = {
    fillColor: "#187498",
    weight: 1.5,
    color: "#187498",
    fillOpacity: 0.1,
  };

  const [loc, setLoc] = useState({ municity: "", province: "" });
  const [mapCenter, setMapCenter] = useState([13, 122]);
  const [featureBounds, setFeatureBounds] = useState([
    116.930117636657, 4.64168888115381, 126.605638820405, 20.9366800806089,
  ]);
  const [featureCenter, setFeatureCenter] = useState([13, 122]);
  const [municityGroup, setMunicityGroup] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(5);

  //shows popup message for each municities
  function onEachMunicity(municity, layer) {
    const municityName = municity.properties.municity;

    layer.bindTooltip(municityName, {
      className: "tooltip-municity-name",
      permanent: true,
      direction: "center",
    });

    if (zoomLevel < 10) {
      layer.unbindTooltip();
    }
  }

  //filter the list of municities depending on the selected province
  function filterByProvince(municity) {
    if (municity.properties.province === loc.province) return true;
  }

  useEffect(() => {
    setMunicityGroup(() => {
      if (loc.province) {
        const filterByProvince = municities.features.filter((feature) => {
          return feature.properties.province === loc.province;
        });
        return filterByProvince;
      }
    });

    setFeatureCenter((prev) => {
      setMapCenter(prev);
      if (loc.province) {
        const provinceSelected = municities.features.find((feature) => {
          return feature.properties.province === loc.province;
        });
        const feature = center(provinceSelected);
        return [
          feature.geometry.coordinates[1],
          feature.geometry.coordinates[0],
        ];
      } else {
        return [13, 122];
      }
    });

    setFeatureBounds(() => {
      if (loc.province) {
        const filterByProvince = municities.features.filter((feature) => {
          return feature.properties.province === loc.province;
        });

        return bbox({ type: "FeatureCollection", features: filterByProvince });
      } else
        return [
          116.930117636657, 4.64168888115381, 126.605638820405,
          20.9366800806089,
        ];
    });
  }, [loc.province]);

  return (
    <div>
      <MapContainer
        key={featureCenter}
        center={mapCenter}
        zoom={10}
        zoomControl={false}
        whenReady={(e) => {
          e.target.flyToBounds(
            [
              [featureBounds[1], featureBounds[0]],
              [featureBounds[3], featureBounds[2]],
            ],
            { duration: 1 }
          );
        }}
      >
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={15}
        />

        {/* set key to force render geojson every user input for province */}
        <GeoJSON
          key={zoomLevel}
          data={municities.features}
          style={mapStyle}
          onEachFeature={onEachMunicity}
          filter={filterByProvince}
        />

        <ZoomControl position="topright" />
        {/* <ZoomToFeature location={loc}/> */}
        <GetZoom setZoomLevel={setZoomLevel} />
      </MapContainer>

      <Box sx={{ position: "fixed", top: "10px" }}>
        <SearchCard searchLoc={setLoc} />
      </Box>
    </div>
  );
}
