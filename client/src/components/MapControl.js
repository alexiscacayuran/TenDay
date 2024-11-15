import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

import ButtonGroup from "@mui/joy/ButtonGroup";
import Button from "@mui/joy/Button";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import Tooltip from "@mui/joy/Tooltip";
import { Stack } from "@mui/material";

// Custom Zoom Control Component
const CustomZoomControl = () => {
  const map = useMap(); // Get map instance from React Leaflet

  // Zoom in and Zoom out functions
  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  // Add the custom control box to the map
  useEffect(() => {
    const customControl = L.control({ position: "topright" }); // Position can be "topleft", "topright", etc.

    customControl.onAdd = () => {
      const div = L.DomUtil.create("div");
      div.className = "leaflet-bar"; // Optional: add Leaflet's default bar styling

      return div;
    };

    customControl.addTo(map);

    const controlContainer = document.querySelector(
      ".leaflet-top.leaflet-right .leaflet-bar"
    );

    if (controlContainer) {
      controlContainer.appendChild(
        document.querySelector("#custom-zoom-control")
      );
    }

    return () => {
      customControl.remove(); // Cleanup on unmount
    };
  }, [map]);

  return (
    <Stack
      id="custom-zoom-control"
      direction="column"
      spacing={1}
      sx={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ButtonGroup
        orientation="vertical"
        color="neutral"
        variant="soft"
        sx={{ width: 35 }}
      >
        <Button onClick={handleZoomIn}>
          <AddIcon />
        </Button>
        <Button onClick={handleZoomOut}>
          <RemoveIcon />
        </Button>
      </ButtonGroup>
      <Tooltip placement="left" title="See current location" variant="solid">
        <Button color="neutral" variant="soft" sx={{ width: 35 }}>
          <MyLocationIcon />
        </Button>
      </Tooltip>
    </Stack>
  );
};

export default CustomZoomControl;
