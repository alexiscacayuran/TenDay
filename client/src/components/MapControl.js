import React, { useState, useEffect } from "react";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Button from "@mui/joy/Button";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import Tooltip from "@mui/joy/Tooltip";
import { Box, Stack } from "@mui/joy";

const CustomZoomControl = ({ map }) => {
  const [zoomLevel, setZoomLevel] = useState(null);
  // console.log(zoomLevel);

  useEffect(() => {
    map.on("zoomend", () => setZoomLevel(map.getZoom()));
  }, [map]);

  return (
    <Box sx={{ position: "absolute", top: 60, right: 10 }}>
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
            onClick={(e) => {
              map.zoomIn();
            }}
          >
            <AddIcon />
          </Button>
          <Button
            onClick={(e) => {
              map.zoomOut();
            }}
          >
            <RemoveIcon />
          </Button>
        </ButtonGroup>
        <Tooltip placement="left" title="See current location" variant="solid">
          <Button color="neutral" variant="soft" sx={{ width: 35 }}>
            <MyLocationIcon />
          </Button>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default CustomZoomControl;
