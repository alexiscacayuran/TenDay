import { useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { geocodeService } from "esri-leaflet-geocoder";
import axios from "axios";

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
import ForecastPopup from "./ForecastPopup";

const GeoSearch = ({
  accessToken,
  location,
  setLocation,
  map,
  layerGroup,
  setOpenModal,
  setOpenContainer,
  openContainer,
}) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [address, setAddress] = useState("");
  const [forecast, setForecast] = useState({});
  const [isForecastReady, setIsForecastReady] = useState(false); // Track forecast readiness

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
    setAddress(text);
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

          setIsForecastReady(false); // Reset forecast readiness on new click

          setLocation({
            latLng: result.latlng,
            municity: result.properties.City,
            province: result.properties.Subregion,
          });

          // // Fetch forecast data based on geocoded location
          // axios
          //   .get("/current", {
          //     params: {
          //       municity: result.properties.City,
          //       province: result.properties.Subregion,
          //     },
          //   })
          //   .then((res) => {
          //     setForecast(res.data);
          //     setIsForecastReady(true); // Set forecast readiness after data is updated
          //   })
          //   .catch((error) => {
          //     console.error(error);
          //     setForecast(null);
          //     setIsForecastReady(true); // Set forecast readiness after data is updated
          //   });

          // // Add marker for the selected result
          // const marker = L.marker(result.latlng).addTo(layerGroup.current);
          setOpenModal(false);
          map.flyTo(result.latlng, 12, { duration: 0.1 });

          // // Bind popup with location information
          // marker
          //   .bindPopup(`<strong>${result.address.Match_addr}</strong>`)
          //   .openPopup();
        }
      });

    // Clear suggestions after selection
    setSuggestions([]);
  };

  const handleSelectSuggestion = (text) => {
    setAddress(text);

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

          map.flyTo(result.latlng, 12, { duration: 2 });
          setOpenModal(false);
          setOpenContainer(true);
        }
      });
  };

  return (
    <div>
      <Input
        startDecorator={<SearchIcon />}
        placeholder="Search location"
        value={input}
        onChange={handleInputChange}
        size="lg"
        sx={{
          mx: "10px",
          minWidth: 150,
        }}
      />

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

      {/* {openContainer && (
        <ForecastPopup
          location={location}
          layerGroup={layerGroup}
          setOpenContainer={setOpenContainer}
          openContainer={openContainer}
        />
      )} */}
    </div>
  );
};

export default GeoSearch;
