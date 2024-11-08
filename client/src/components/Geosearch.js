import { useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { geocodeService } from "esri-leaflet-geocoder";
import axios from "axios";

//styles
import Box from "@mui/joy/Box";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import SearchIcon from "@mui/icons-material/Search";
import Typography from "@mui/joy/Typography";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListDivider from "@mui/joy/ListDivider";
import { IconButton } from "@mui/joy";
import MapIcon from "@mui/icons-material/Map";
import Stack from "@mui/joy/Stack";

// custom components
import ForecastTooltip from "./ForecastTooltip";

const GeoSearch = ({ accessToken, setLocation, map }) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [address, setAddress] = useState("");

  const [position, setPosition] = useState(null);
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
  const handleSelectSuggestion = (text) => {
    setAddress(text);
    // Perform geocode search using the selected suggestion text
    const _geocodeService = geocodeService({
      apikey: accessToken,
    });
    _geocodeService
      .geocode()
      .text(text)
      .run((error, res) => {
        if (!error) {
          const result = res.results[0];

          setPosition(result.latlng);
          setIsForecastReady(false); // Reset forecast readiness on new click

          setLocation({
            municity: result.properties.City,
            province: result.properties.Subregion,
          });

          // Fetch forecast data based on geocoded location
          axios
            .get("/current", {
              params: {
                municity: result.properties.City,
                province: result.properties.Subregion,
              },
            })
            .then((res) => {
              setForecast(res.data);
              setIsForecastReady(true); // Set forecast readiness after data is updated
            })
            .catch((error) => {
              console.error(error);
              setForecast(null);
              setIsForecastReady(true); // Set forecast readiness after data is updated
            });

          // // Add marker for the selected result
          // const marker = L.marker(result.latlng).addTo(layerGroup.current);
          map.flyTo(result.latlng, 12);

          // // Bind popup with location information
          // marker
          //   .bindPopup(`<strong>${result.address.Match_addr}</strong>`)
          //   .openPopup();
        }
      });

    // Clear suggestions after selection
    setSuggestions([]);
  };

  return (
    <div>
      <Input
        startDecorator={<SearchIcon />}
        placeholder={
          suggestions.length > 0
            ? address.split(", ")[0] + ", " + address.split(", ")[1]
            : "Search a location"
        }
        value={input}
        onChange={handleInputChange}
        sx={{
          mx: "10px",
          minWidth: 300,
        }}
      />

      {suggestions.length > 0 && (
        <Box
          sx={{
            mx: "10px",
            mt: "5px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            backgroundColor: "white",
            borderRadius: "sm",
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
                    <IconButton
                      aria-label="See Full Forecast"
                      size="sm"
                      color="primary"
                      onClick={() => handleSelectSuggestion(suggestion.text)}
                    >
                      <MapIcon />
                    </IconButton>
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
                        {"Place in " + suggestion.text.split(", ")[1]}
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
      )}

      {/* {isForecastReady ? (
        <ForecastTooltip
          forecast={forecast}
          position={position}
          layerGroup={layerGroup}
        />
      ) : null} */}
    </div>
  );
};

export default GeoSearch;
