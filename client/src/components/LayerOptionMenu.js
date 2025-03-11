import React, { useState } from "react";
import Sheet from "@mui/joy/Sheet";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Switch from "@mui/joy/Switch";
import Stack from "@mui/joy/Stack";

const LayerOptionMenu = ({
  isDiscrete,
  setIsDiscrete,
  isAnimHidden,
  setIsAnimHidden,
}) => {
  const [checked, setChecked] = useState(isDiscrete);
  const [checkedAnim, setCheckedAnim] = useState(isAnimHidden);

  return (
    <Box sx={{ position: "absolute", bottom: 20, left: 10, zIndex: 999 }}>
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
          <Typography component="label" level="title-sm" sx={{ flexGrow: 1 }}>
            Show Edges
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
          <Typography component="label" level="title-sm" sx={{ flexGrow: 1 }}>
            Wind Animation
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
      </Stack>
    </Box>
  );
};

export default LayerOptionMenu;
