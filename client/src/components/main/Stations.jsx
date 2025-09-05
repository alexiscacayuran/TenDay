import React, { useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import { Pane, Marker, Popup, useMap } from "react-leaflet";
import { DivIcon } from "leaflet";
import { Box, Stack, Typography, IconButton } from "@mui/joy";
import Station from "../../assets/img/station.png";
import CloseIcon from "@mui/icons-material/Close";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import StationsPanel from "./StationsPanel";

const Stations = ({ markerRef, markerLayer, selectedPolygon, setOpen }) => {
  const stations = useRef([]);
  const map = useMap();

  const stationMarker = new DivIcon({ className: "station-marker" });

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await axios.get("/api/stations");
        stations.current = response.data;
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };

    fetchStations();
  }, []);

  const handlePopupClose = () => {
    const stationPane = map.getPane("station");
    if (!stationPane) return;

    // Loop through all layers and remove any popup with matching class
    map.eachLayer((layer) => {
      if (layer instanceof L.Popup) {
        map.removeLayer(layer); // Or layer.closePopup()
      }
    });
  };

  const createClusterCustomIcon = (cluster) => {
    return L.divIcon({
      html: `<b class="cluster-icon-count">${cluster.getChildCount()}</b>`,
      className: "cluster-icon",
      iconSize: L.point(25, 25, true),
    });
  };

  return (
    <Pane name="station">
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        showCoverageOnHover={false}
        animate={false}

        // animateAddingMarkers={true}
        // singleMarkerMode={true}
      >
        {stations.current.map((stn, i) => (
          <Marker
            key={i}
            ref={markerRef}
            icon={stationMarker}
            position={[stn.lat, stn.long]}
            eventHandlers={{
              click: () => {
                if (markerLayer.current && markerRef.current) {
                  markerLayer.current.removeLayer(markerRef.current);
                }
                if (selectedPolygon.current) {
                  map.removeLayer(selectedPolygon.current);
                  selectedPolygon.current = null;
                }

                setOpen(false);
              },
            }}
          >
            <Popup
              className="popup-station"
              closeButton={false}
              offset={[0, -20]}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "250px",
                  height: "250px",
                  boxSizing: "border-box",
                  backgroundImage: `url(${Station})`,
                  borderRadius: "12px",
                  userSelect: "none",
                  cursor: "default",
                }}
              >
                <IconButton
                  variant="plain"
                  color="inherit"
                  sx={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    fontSize: "1.5rem",
                    color: "common.white",
                  }}
                  onClick={handlePopupClose}
                >
                  <CloseIcon />
                </IconButton>
                <Stack direction="column" sx={{ p: 2 }}>
                  <Typography
                    level="body-xs"
                    sx={{ color: "common.white", fontSize: "0.6rem" }}
                  >
                    {stn.type === "synoptic"
                      ? "SYNOPTIC STATION"
                      : stn.type === "agromet"
                      ? "AGROMET STATION"
                      : "WEATHER STATION"}
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    <Typography
                      level="title-md"
                      sx={{ color: "common.white", fontWeight: "bolder" }}
                    >
                      {stn.station}
                    </Typography>
                  </Box>
                  <Typography level="body-xs" sx={{ color: "primary.300" }}>
                    {"[" + stn.lat + ", " + stn.long + "]"}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "primary.300" }}>
                    {"Elevation: " +
                      (stn.elev != null ? stn.elev + "m" : "no data")}
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Typography level="body-xs" sx={{ color: "common.white" }}>
                      Explore the climatology information from this station
                    </Typography>
                    <StationsPanel station={stn} />
                  </Box>
                </Stack>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </Pane>
  );
};

export default Stations;
