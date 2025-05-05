import React, { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Button from "@mui/joy/Button";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import Tooltip from "@mui/joy/Tooltip";
import { Box, Stack } from "@mui/joy";

const CustomZoomControl = ({ map }) => {
  // const [zoomLevel, setZoomLevel] = useState(null);
  // const map = useMap();
  // console.log(zoomLevel);

  // useEffect(() => {
  //   map.on("zoomend", () => setZoomLevel(map.getZoom()));
  // }, [map]);

  return (
    <Box sx={{ position: "absolute", top: 60, right: 10, zIndex: 999 }}>
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
          <Button
            className="glass"
            onClick={(e) => {
              e.stopPropagation();
              map.zoomIn();
            }}
          >
            <AddIcon />
          </Button>
          <Button
            className="glass"
            onClick={(e) => {
              e.stopPropagation();
              map.zoomOut();
            }}
          >
            <RemoveIcon />
          </Button>
        </ButtonGroup>
      </Stack>
    </Box>
  );
};

export default CustomZoomControl;
