import React, { useEffect, useState } from "react";
import {
  Box,
  Input,
  Tooltip,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListDivider,
  ListSubheader,
  IconButton,
  Stack,
  Sheet,
  Button,
} from "@mui/joy";
import MapIcon from "@mui/icons-material/Map";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faLocationCrosshairs,
  faTimes,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { geocodeService, reverseGeocode } from "esri-leaflet-geocoder";
import { query } from "esri-leaflet";
import L from "leaflet";
import { useMediaQuery } from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../bottom/FavoriteButton";

const Search = ({
  arcgisToken,
  setLocation,
  map,
  setOpen,
  setIsLocationReady,
  location,
  selectedPolygon,
  searchLayout,
  setSearchLayout,
  isLocateOnly,
}) => {
  const isBelowLaptop = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true);
  const [isUsing, setIsUsing] = useState(false);

  const favorites = useLiveQuery(() => db.favorites.toArray(), []);

  const clearFavorites = async () => {
    setShowFavorites(false);
    await db.favorites.clear();
  };

  const handleSelectFavorite = (location) => {
    setLocation({
      latLng: location.latLng,
      municity: location.municity,
      province: location.province,
    });
    map.flyTo(location.latLng, 12, { duration: 2 });
    setOpen(true);
    setIsLocationReady(true);
  };

  const isInteractive = (target) => {
    if (!target) return false;
    return (
      target.closest("button") ||
      target.closest('[role="button"]') ||
      target.closest('[data-clickable="true"]')
    );
  };

  const _query = query({
    url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2022/FeatureServer/3",
  }).token(arcgisToken);

  const executeQuery = (result) => {
    _query.nearby(result.latlng, 1).run((error, featureCollection) => {
      if (error) return console.error(error);
      if (selectedPolygon.current) map.removeLayer(selectedPolygon.current);

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

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (!val) return setSuggestions([]);

    geocodeService({ apikey: arcgisToken })
      .suggest()
      .text(val)
      .nearby([13, 122])
      .category("City")
      .within([
        [4.64, 116.93],
        [20.94, 126.61],
      ])
      .run((error, results) => {
        if (!error) setSuggestions(results.suggestions);
      });
  };

  const handleSelectSuggestion = (text) => {
    setIsLocationReady(false);
    geocodeService({ apikey: arcgisToken })
      .geocode()
      .text(text)
      .within([
        [4.64, 116.93],
        [20.94, 126.61],
      ])
      .run((error, res) => {
        if (!error) {
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
          if (searchLayout) {
            setSearchLayout(undefined);
          }
        }
      });
  };

  const handleFlyToLocation = (text) => {
    geocodeService({ apikey: arcgisToken })
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
          setInput("");
          map.flyTo(result.latlng, 12, { duration: 2 });
        }
      });
    setSuggestions([]);
  };

  const handleLocate = () => {
    setIsLocationReady(false);
    map.locate({ setView: true, maxZoom: 12 });
    map.once("locationfound", (e) => {
      const latlng = e.latlng;
      reverseGeocode({ apikey: arcgisToken })
        .latlng(latlng)
        .run((error, result) => {
          if (!error) {
            setLocation({
              latLng: result.latlng,
              municity: result.address.City,
              province: result.address.Subregion,
            });
            executeQuery(result);
            map.flyTo(result.latlng, 12, { duration: 2 });
            setOpen(true);
            setIsLocationReady(true);
          }
        });
    });
  };

  return (
    <>
      {!isLocateOnly ? (
        //show full search bar with geolocate button beside it
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mr: { md: "1.25rem", lg: 0 },

            flexGrow: 1,
            flexShrink: 1,
            justifyContent: "flex-start",
            alignItems: !searchLayout ? "center" : "flex-start",
          }}
        >
          <Stack
            direction="column"
            spacing={0}
            sx={{
              flexGrow: 1,
              flexShrink: 1,
              justifyContent: "center",
              alignItems: "center",
              minWidth: 100,
            }}
          >
            <Input
              placeholder={
                location?.municity
                  ? `${location.municity}, ${location.province}`
                  : "Search for location..."
              }
              value={input}
              startDecorator={
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{ fontSize: "1.25rem", color: "white" }}
                />
              }
              size={isBelowLaptop ? "lg" : "md"}
              variant="solid"
              sx={{
                flexShrink: 1,
                flexGrow: 1,
                width: "100%",
                minWidth: 0,
                "--Input-radius": "24px",
                backgroundColor: { xs: "neutral.500", lg: "neutral.600" },
                color: "common.white",
                border: !searchLayout ? "none" : "2px solid white",
              }}
              endDecorator={
                input && (
                  <IconButton
                    size="sm"
                    color="inherit"
                    onClick={() => {
                      setSuggestions([]);
                      setInput("");
                    }}
                    sx={{ bgcolor: "transparent", color: "white" }}
                  >
                    <FontAwesomeIcon
                      icon={faTimes}
                      style={{ fontSize: "1.25rem" }}
                    />
                  </IconButton>
                )
              }
              onFocus={() => {
                setIsFocused(true);
                if (input.trim() === "") {
                  setShowFavorites(true);
                }
              }}
              onBlur={() => {
                // Defer blur handling to allow click event on favorites to register
                setTimeout(() => {
                  if (!isUsing) {
                    setIsFocused(false);
                    setShowFavorites(false);
                  }
                }, 100);
              }}
              onChange={(e) => {
                const value = e.target.value;
                setInput(value);
                handleInputChange(e);
                if (value.trim() !== "") {
                  setShowFavorites(false);
                } else {
                  setShowFavorites(true);
                }
              }}
            />
            {isFocused && showFavorites && (
              <Sheet
                color="neutral"
                variant="solid"
                sx={{
                  width: !searchLayout ? "max-content" : "91vw",
                  borderRadius: "lg",
                  position: "absolute",
                  top: { lg: 70, xs: 70 },
                  left: { lg: 160, xs: 25 },
                  userSelect: "none",
                }}
                onMouseDownCapture={(e) => {
                  if (isInteractive(e.target)) {
                    setIsUsing(true);
                  }
                }}
                onMouseUp={() => {
                  setTimeout(() => {
                    setIsUsing(false);
                  }, 100);
                }}
              >
                <Box sx={{ mx: 1 }}>
                  <List
                    sx={{
                      minWidth: 300,
                      maxWidth: !searchLayout ? 300 : "none",
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                      }}
                    >
                      <ListSubheader sx={{ color: "common.white" }}>
                        Favorites
                      </ListSubheader>
                      {favorites.length > 0 && (
                        <Button
                          size="sm"
                          color="neutral"
                          variant="solid"
                          sx={{
                            backgroundColor: "neutral.600",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: "normal",
                            paddingInline: "0.75rem",
                            height: "0.75rem",
                            m: 1,
                          }}
                          onClick={clearFavorites}
                        >
                          Clear
                        </Button>
                      )}
                    </Stack>

                    {favorites.length === 0 ? (
                      <ListItem>
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "white",
                            width: "100%",
                            fontStyle: "italic",
                          }}
                        >
                          No locations saved yet. Add by clicking the{" "}
                          <FontAwesomeIcon
                            icon={faStar}
                            animate={{
                              color: "#32383E",
                            }}
                            transition={{ duration: 0.1 }}
                            style={{ fontSize: "1rem" }}
                          />{" "}
                          in the forecast panel.
                        </Typography>
                      </ListItem>
                    ) : (
                      favorites.map((loc, i) => (
                        <div key={i}>
                          <ListItem>
                            <ListItemButton
                              sx={{
                                '&:not(.Mui-selected, [aria-selected="true"]):hover':
                                  {
                                    backgroundColor: "neutral.700",
                                    borderRadius: "lg",
                                  },
                                '&:not(.Mui-selected, [aria-selected="true"]):active':
                                  {
                                    backgroundColor: "neutral.700",
                                    borderRadius: "lg",
                                  },
                              }}
                              onClick={() => {
                                setShowFavorites(false);
                                handleSelectFavorite(loc);
                              }}
                            >
                              <Stack spacing={0}>
                                <Typography
                                  level="title-md"
                                  sx={{
                                    color: "primary.400",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {loc.municity}
                                </Typography>
                                <Typography
                                  level="body-xs"
                                  sx={{ color: "white" }}
                                >
                                  {loc.province}
                                </Typography>
                              </Stack>
                            </ListItemButton>
                          </ListItem>
                          {i < favorites.length - 1 && (
                            <ListDivider
                              sx={{ backgroundColor: "white" }}
                              inset="gutter"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </List>
                </Box>
              </Sheet>
            )}
            {suggestions.length > 0 && (
              <Sheet
                color="neutral"
                variant="solid"
                sx={{
                  width: !searchLayout ? "max-content" : "91vw",
                  borderRadius: "lg",
                  position: "absolute",
                  top: { lg: 70, xs: 70 },
                  left: { lg: 160, xs: 25 },
                  userSelect: "none",
                }}
              >
                <Box sx={{ mx: 1 }}>
                  <List
                    sx={{
                      minWidth: 300,
                      maxWidth: !searchLayout ? 300 : "none",
                    }}
                  >
                    {suggestions.map((s, i) => (
                      <div key={i}>
                        <ListItem
                          endAction={
                            <Tooltip title="See on map">
                              <IconButton
                                color="inherit"
                                sx={{
                                  fontSize: "1.25rem",
                                  color: "white",
                                }}
                                onClick={() => handleFlyToLocation(s.text)}
                              >
                                <MapIcon />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemButton
                            sx={{
                              '&:not(.Mui-selected, [aria-selected="true"]):hover':
                                {
                                  backgroundColor: "neutral.700",
                                  borderRadius: "lg",
                                },
                              '&:not(.Mui-selected, [aria-selected="true"]):active':
                                {
                                  backgroundColor: "neutral.700",
                                  borderRadius: "lg",
                                },
                            }}
                            onClick={() => handleSelectSuggestion(s.text)}
                          >
                            <Stack spacing={0}>
                              <Typography
                                level="title-md"
                                sx={{
                                  color: "primary.400",
                                  fontWeight: "bold",
                                }}
                              >
                                {s.text.split(", ")[0]}
                              </Typography>
                              <Typography
                                level="body-xs"
                                sx={{ color: "white" }}
                              >
                                {s.text.split(", ")[1]}
                                {s.text.split(", ").length > 3
                                  ? ", " + s.text.split(", ")[2]
                                  : ""}
                              </Typography>
                            </Stack>
                          </ListItemButton>
                        </ListItem>
                        {i < suggestions.length - 1 && (
                          <ListDivider
                            sx={{ backgroundColor: "white" }}
                            inset="gutter"
                          />
                        )}
                      </div>
                    ))}
                  </List>
                </Box>
              </Sheet>
            )}
          </Stack>

          {!searchLayout ? (
            <IconButton
              color="neutral"
              variant="solid"
              onClick={handleLocate}
              size={isBelowLaptop ? "lg" : "md"}
              sx={{
                borderRadius: "24px",
                backgroundColor: isBelowLaptop ? "neutral.500" : "neutral.600",
              }}
            >
              <FontAwesomeIcon
                icon={faLocationCrosshairs}
                style={{ fontSize: "1.25rem", color: "white" }}
              />
            </IconButton>
          ) : (
            <Button
              size="lg"
              color="inherit"
              sx={{
                color: "common.white",
                border: "2px solid white",
                borderRadius: "20px",
              }}
              onClick={() => {
                setSearchLayout(undefined);
              }}
            >
              esc
            </Button>
          )}
        </Stack>
      ) : (
        //hide search bar and use only the geolocate, when on mobile
        <IconButton color="inherit" onClick={handleLocate} size="lg">
          <FontAwesomeIcon
            icon={faLocationCrosshairs}
            style={{
              fontSize: "1.5rem",
              color: "white",
              WebkitFilter: "drop-shadow(1px 1px 2px rgba(21, 21, 21, 0.2)",
              filter: "drop-shadow(1px 1px 2px rgba(21, 21, 21, 0.2)",
            }}
          />
        </IconButton>
      )}
    </>
  );
};

export default Search;
