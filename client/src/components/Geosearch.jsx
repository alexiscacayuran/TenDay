import React, { useEffect, useState } from "react";
import L from "leaflet";
import { geocodeService, reverseGeocode } from "esri-leaflet-geocoder";
import { query } from "esri-leaflet";
import { useTheme } from "@mui/joy/styles";
import { useMediaQuery } from "@mui/material";

import {
  Button,
  Box,
  Input,
  Tooltip,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListDivider,
  IconButton,
  Stack,
  Sheet,
} from "@mui/joy";

import Logo from "../assets/logo/logo-rgb-light.png";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SearchIcon from "@mui/icons-material/Search";
import MapIcon from "@mui/icons-material/Map";

const GeoSearch = ({
  arcgisToken,
  setLocation,
  map,
  setOpen,
  setIsLocationReady,
  location,
  selectedPolygon,
}) => {
  const theme = useTheme();
  const isBelowLaptop = useMediaQuery(theme.breakpoints.down("lg"));

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [localLocation, setLocalLocation] = useState({
    latLng: {},
    municity: "",
    province: "",
  });

  const _query = query({
    url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2022/FeatureServer/3",
  });
  _query.token(arcgisToken);

  const executeQuery = (result) => {
    console.log(result);
    _query.nearby(result.latlng, 1);

    _query.run(function (error, featureCollection, response) {
      if (error) {
        console.log(error);
        return;
      }

      if (selectedPolygon.current) {
        map.removeLayer(selectedPolygon.current);
      }

      const feature = featureCollection.features[0];

      const selectedMunicity = L.geoJSON(feature, {
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
    });
  };

  useEffect(() => {
    setLocalLocation(location);
  }, [location]);

  // Get suggestions based on input
  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (e.target.value) {
      // Fetch suggestions based on input using geocodeService
      const _geocodeService = geocodeService({
        apikey: arcgisToken,
      });
      _geocodeService
        .suggest()
        .text(e.target.value)
        .nearby([13, 122])
        .category("City")
        .within([
          [4.64, 116.93],
          [20.94, 126.61],
        ])
        .run((error, results) => {
          if (!error) {
            setSuggestions(results.suggestions);
          }
        });
    } else {
      setSuggestions([]);
    }
  };

  // Handle selection of a suggestion
  const handleFlyToLocation = (text) => {
    const _geocodeService = geocodeService({
      apikey: arcgisToken,
    });

    _geocodeService
      .geocode()
      .city(text)
      .run((error, res) => {
        if (!error) {
          console.log("Geocode result", res);
          const result = res.results[0];

          setLocation({
            latLng: result.latlng,
            municity: result.properties.City,
            province: result.properties.Subregion,
          });

          setInput("");
          map.flyTo(result.latlng, 12, { duration: 2 });
        }
      });

    setSuggestions([]);
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Enter" && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0].text);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [suggestions]);

  const handleSelectSuggestion = (text) => {
    // Perform geocode search using the selected suggestion text

    setIsLocationReady(false);
    const _geocodeService = geocodeService({
      apikey: arcgisToken,
    });

    _geocodeService
      .geocode()
      .text(text)
      .within([
        [4.64, 116.93],
        [20.94, 126.61],
      ])
      .run((error, res) => {
        if (!error) {
          console.log(res);
          const result = res.results[0];

          setLocation({
            latLng: result.latlng,
            municity: result.properties.City,
            province: result.properties.Subregion,
          });

          executeQuery(result);

          map.flyTo(result.latlng, 12, { duration: 2 });
          setInput("");
          setSuggestions([]);
          setOpen(true);
          setIsLocationReady(true);
        }
      });
  };

  // Handle user location and reverse geocoding
  const handleLocate = () => {
    setIsLocationReady(false);
    map.locate({ setView: true, maxZoom: 12 });

    map.once("locationfound", (e) => {
      const latlng = e.latlng;

      // Perform reverse geocoding
      reverseGeocode({
        apikey: arcgisToken,
      })
        .latlng(latlng)
        .run((error, result) => {
          if (!error) {
            console.log(result);

            setLocation({
              latLng: result.latlng,
              municity: result.address.City,
              province: result.address.Subregion,
            });

            executeQuery(result);

            // markerLayer.current.clearLayers();
            map.flyTo(result.latlng, 12, { duration: 2 });

            setOpen(true);

            setIsLocationReady(true);
          }
        });
    });
  };

  const searchbar = (
    <Stack
      variant="solid"
      direction="row"
      spacing={1}
      sx={{
        justifyContent: "flex-start",
        alignItems: "center",
        mr: isBelowLaptop ? "1.25rem" : 0,
      }}
    >
      <img
        src={Logo}
        style={{
          height: !isBelowLaptop ? "30px" : "25px",
          marginRight: 10,
        }}
      />

      <Input
        placeholder={
          localLocation.municity
            ? localLocation.municity + ", " + localLocation.province
            : "Search for location..."
        }
        color="neutral"
        size={!isBelowLaptop ? "md" : "lg"}
        variant="solid"
        value={input}
        startDecorator={
          <SearchIcon sx={{ color: "common.white", fontSize: "1.25rem" }} />
        }
        sx={{
          width: "100%",
          maxWidth: 400,
          minWidth: 42,
          flexShrink: 1,
          "--Input-radius": "24px",
          "--variant-borderWidth": "3px",
          borderWidth: "1px",
          borderColor: "common.white",
          backgroundColor: "neutral.600",
          boxShadow: "none",
          color: "common.white",
        }}
        onChange={handleInputChange}
      />
      {suggestions.length > 0 ? (
        <Sheet
          sx={{
            position: "absolute",
            top: !isBelowLaptop ? 70 : 50,
            left: !isBelowLaptop ? 160 : 280,
            borderRadius: "8px",
          }}
        >
          <Box
            sx={{
              mx: "10px",
              mt: "5px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <List
              sx={{
                minWidth: 300,
                maxWidth: 500,
                borderRadius: "sm",
              }}
            >
              {suggestions.map((suggestion, index) => (
                <div key={index}>
                  <ListItem
                    endAction={
                      <Tooltip
                        placement="bottom"
                        title="See on map"
                        variant="plain"
                      >
                        <IconButton
                          aria-label="See Full Forecast"
                          color="primary"
                          sx={{ fontSize: "1.5rem" }}
                          onClick={() => {
                            setInput(
                              suggestion.text.split(", ")[0] +
                                ", " +
                                suggestion.text.split(", ")[1]
                            );
                            handleFlyToLocation(suggestion.text);
                          }}
                        >
                          <MapIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemButton
                      onClick={() => handleSelectSuggestion(suggestion.text)}
                    >
                      <Stack spacing={1} sx={{ maxWidth: "100ch" }}>
                        <Typography level="title-lg" color="primary">
                          {suggestion.text.split(", ")[0]}
                        </Typography>
                        <Typography level="title-sm">
                          {suggestion.text.split(", ")[1]}
                          {suggestion.text.split(", ").length > 3
                            ? ", " + suggestion.text.split(", ")[2]
                            : ""}
                        </Typography>
                      </Stack>
                    </ListItemButton>
                  </ListItem>

                  {index < suggestions.length - 1 && (
                    <ListDivider
                      inset="gutter"
                      sx={{ "--Divider-thickness": "0.5px" }}
                    />
                  )}
                </div>
              ))}
            </List>
          </Box>
        </Sheet>
      ) : (
        <Box />
      )}

      <IconButton
        size={!isBelowLaptop ? "md" : "lg"}
        color="neutral"
        variant="solid"
        onClick={handleLocate}
        sx={{ borderRadius: "25px", backgroundColor: "neutral.600" }}
      >
        <MyLocationIcon sx={{ fontSize: "1.5rem" }} />
      </IconButton>
    </Stack>
  );

  return (
    <Box
      sx={{
        pointerEvents: "auto",
        width: "600px",
        minWidth: 0,
        flexShrink: 1,
      }}
    >
      {!isBelowLaptop ? (
        <Sheet
          variant="solid"
          sx={{
            borderRadius: "lg",
            py: 1.5,
            paddingInline: "1.25rem",
            boxShadow: "sm",
            mx: "1.25rem",
          }}
        >
          {searchbar}
        </Sheet>
      ) : (
        <>{searchbar}</>
      )}
    </Box>
  );
};

export default GeoSearch;
