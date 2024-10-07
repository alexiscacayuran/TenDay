import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";
import { Box, Container } from "@mui/material";
import "leaflet/dist/leaflet.css";
import municities from "../data/municities.json";
import province from "../data/province.json";
import SearchCard from "./SearchCard";
import "dotenv/config";

console(process.env);

export default function PhilippineMap() {
  //province state variable
  const [loc, setLoc] = useState("");
  const [bounds, setBounds] = useState([
    116.930117636657, 4.64168888115381, 126.605638820405, 20.9366800806089,
  ]);

  //map style
  const mapStyle = {
    fillColor: "#187498",
    weight: 1.5,
    color: "#187498",
    fillOpacity: 0.1,
  };

  //shows popup message for each municities
  function onEachMunicity(municity, layer) {
    const municityName = municity.properties.municity;
    layer.bindPopup(municityName);
  }

  //filter the list of municities depending on the selected province
  function filterByProvince(municity) {
    if (municity.properties.province === loc) return true;
  }

  useEffect(() => {
    setBounds(() => {
      if (loc !== "") {
        const provinceSelected = province.features.find((feature) => {
          return feature.properties.province === loc;
        });
        return provinceSelected.bbox;
      } else
        return [
          116.930117636657, 4.64168888115381, 126.605638820405,
          20.9366800806089,
        ];
    });
  }, [loc]);

  console.log(bounds);

  return (
    <Container>
      <MapContainer
        key={bounds[0]}
        center={[13, 122]}
        zoom={9}
        zoomControl={false}
        whenReady={(e) => {
          e.target.flyToBounds(
            [
              [bounds[1], bounds[0]],
              [bounds[3], bounds[2]],
            ],
            { duration: 1.5, padding: [50, 50], animate: false }
          );
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {/* {municities.features.map((municity) => {
        const coordinates = municity.geometry.coordinates
      })} */}

        {/* set key to force render geojson every user input for province */}
        <GeoJSON
          key={loc}
          data={municities.features}
          style={mapStyle}
          onEachFeature={onEachMunicity}
          filter={filterByProvince}
        />
        <ZoomControl position="topright" />
      </MapContainer>

      <Box sx={{ position: "fixed", top: "10px" }}>
        <SearchCard searchLoc={setLoc} />
      </Box>
    </Container>
  );
}
