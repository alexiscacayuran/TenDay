import React, { useEffect, useState } from "react";
import L from "leaflet";
import { DivIcon } from "leaflet";
import { ModalClose } from "@mui/joy";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { geocodeService, reverseGeocode } from "esri-leaflet-geocoder";

//styles
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
import SearchIcon from "@mui/icons-material/Search";
import MapIcon from "@mui/icons-material/Map";

// custom components

const GeoSearch = ({
  accessToken,
  setLocation,
  map,
  setOpen,
  setIsLocationReady,
  location,
}) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [localLocation, setLocalLocation] = useState({
    latLng: {},
    municity: "",
    province: "",
  });

  useEffect(() => {
    setLocalLocation(location);
  }, [location]);

  // Get suggestions based on input
  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (e.target.value) {
      // Fetch suggestions based on input using geocodeService
      const _geocodeService = geocodeService({
        apikey: accessToken,
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
    // Perform geocode search using the selected suggestion text
    const _geocodeService = geocodeService({
      apikey: accessToken,
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

    // Clear suggestions after selection
    setSuggestions([]);
  };

  const handleSelectSuggestion = (text) => {
    // Perform geocode search using the selected suggestion text

    setIsLocationReady(false);
    const _geocodeService = geocodeService({
      apikey: accessToken,
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
        apikey: accessToken,
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

            // markerLayer.current.clearLayers();
            map.flyTo(result.latlng, 12, { duration: 2 });

            setOpen(true);

            setIsLocationReady(true);
          }
        });
    });
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Input
          placeholder={
            localLocation.municity
              ? localLocation.municity
              : "Search for location..."
          }
          size="sm"
          variant="solid"
          value={input}
          startDecorator={<SearchIcon sx={{ color: "common.white" }} />}
          sx={{ width: "200px", "--Input-radius": "14px" }}
          onChange={handleInputChange}
        />
        <Button
          size="sm"
          color="neutral"
          variant="solid"
          onClick={handleLocate}
          sx={{ borderRadius: "20px" }}
        >
          <MyLocationIcon />
        </Button>
      </Stack>

      {suggestions.length > 0 ? (
        <Sheet
          sx={{
            position: "absolute",
            top: 60,
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
                          size="sm"
                          color="primary"
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
        <Box></Box>
      )}
      {/* </Sheet> */}
    </>
  );
};

export default GeoSearch;
