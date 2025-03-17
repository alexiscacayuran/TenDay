import React, { useState } from "react";
import Sheet from "@mui/joy/Sheet";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Switch from "@mui/joy/Switch";
import Stack from "@mui/joy/Stack";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import IconButton from "@mui/joy/IconButton";

const LayerOptionMenu = ({
  isDiscrete,
  setIsDiscrete,
  isAnimHidden,
  setIsAnimHidden,
  isLayerClipped,
  setIsLayerClipped,
}) => {
  const [checked, setChecked] = useState(isDiscrete);
  const [checkedAnim, setCheckedAnim] = useState(isAnimHidden);
  const [checkedClip, setCheckedClip] = useState(isLayerClipped);

  return (
    // <Box sx={{ position: "absolute", bottom: 20, left: 10, zIndex: 999 }}>
    <Box sx={{ zIndex: 999, mt: 2 }}>
      {/* <IconButton variant="soft">
        <FavoriteBorder />
      </IconButton> */}
      <Stack
        direction="column"
        spacing={1}
        sx={{
          justifyContent: "center",
          alignItems: "stretch",
          width: "160px",
        }}
      >
        <Sheet
          color="primary"
          variant="soft"
          sx={{
            borderRadius: "md",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1,
          }}
        >
          <Typography
            component="label"
            color="primary.softColor"
            level="title-sm"
            sx={{ flexGrow: 1 }}
          >
            Show edges
          </Typography>
          <Switch
            sx={{ ml: "auto" }}
            checked={checked}
            onChange={(event) => {
              setChecked(event.target.checked);
              setIsDiscrete(event.target.checked);
            }}
          />
        </Sheet>

        <Sheet
          color="primary"
          variant="soft"
          sx={{
            borderRadius: "md",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1,
          }}
        >
          <Typography
            component="label"
            color="primary.softColor"
            level="title-sm"
            sx={{ flexGrow: 1 }}
          >
            Wind animation
          </Typography>
          <Switch
            sx={{ ml: "auto" }}
            checked={!checkedAnim}
            onChange={(event) => {
              setCheckedAnim(!event.target.checked);
              setIsAnimHidden(!event.target.checked);
            }}
          />
        </Sheet>

        <Sheet
          color="primary"
          variant="soft"
          sx={{
            borderRadius: "md",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1,
          }}
        >
          <Typography
            component="label"
            color="primary.softColor"
            level="title-sm"
            sx={{ flexGrow: 1 }}
          >
            Clip weather map
          </Typography>
          <Switch
            sx={{ ml: "auto" }}
            checked={isLayerClipped}
            onChange={(event) => {
              setCheckedClip(event.target.checked);
              setIsLayerClipped(event.target.checked);
            }}
          />
        </Sheet>
      </Stack>
    </Box>
  );
};

export default LayerOptionMenu;
