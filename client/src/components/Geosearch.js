import React, { useState } from "react";
import { geocodeService } from "esri-leaflet-geocoder";
import L from "leaflet";
import { DivIcon } from "leaflet";
import { ModalClose } from "@mui/joy";

//styles
import {
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
} from "@mui/joy";
import SearchIcon from "@mui/icons-material/Search";
import MapIcon from "@mui/icons-material/Map";

// custom components

const GeoSearch = ({
  accessToken,
  setLocation,
  map,
  markerLayer,
  setOpenModal,
  setOpenContainer,
}) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

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
          const result = res.results[0];

          setLocation({
            latLng: result.latlng,
            municity: result.properties.City,
            province: result.properties.Subregion,
          });

          setOpenModal(false);
          map.flyTo(result.latlng, 12, { duration: 2 });
        }
      });

    // Clear suggestions after selection
    setSuggestions([]);
  };

  const handleSelectSuggestion = (text) => {
    // Perform geocode search using the selected suggestion text
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
          const result = res.results[0];
          console.log(result);

          setLocation({
            latLng: result.latlng,
            municity: result.properties.City,
            province: result.properties.Subregion,
          });

          const marker = L.marker(result.latlng, {
            icon: new DivIcon({
              className: "pulsating-marker",
            }),
          });

          marker.addTo(markerLayer.current);
          map.flyTo(result.latlng, 12, { duration: 2 });

          setOpenModal(false);
          setOpenContainer(true);
        }
      });
  };

  return (
    <div>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Input
          startDecorator={<SearchIcon />}
          placeholder="Search location"
          value={input}
          onChange={handleInputChange}
          size="lg"
          sx={{
            mx: "10px",
            width: "90%",
          }}
        />
        <ModalClose
          variant="plain"
          sx={{ m: 1 }}
          slotProps={{ position: "static" }}
        />
      </Stack>

      {suggestions.length > 0 ? (
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
                      variant="solid"
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
                        {suggestion.text.split(", ").length > 3
                          ? "City in "
                          : "Province in "}

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
      ) : (
        <Box></Box>
      )}
    </div>
  );
};

export default GeoSearch;
