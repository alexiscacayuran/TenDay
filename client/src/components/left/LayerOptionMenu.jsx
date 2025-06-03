import React, { useState } from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Switch from "@mui/joy/Switch";
import IconButton from "@mui/joy/IconButton";
import {
  LayerStyleIcon,
  GradientIcon,
  ParticlesIcon,
} from "../utils/CustomIcons";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import ListSubheader from "@mui/joy/ListSubheader";
import Popover from "@mui/material/Popover";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScissors } from "@fortawesome/free-solid-svg-icons";

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
    <Box sx={{ zIndex: 999 }}>
      <PopupState variant="popover" popupId="demo-popup-popover">
        {(popupState) => (
          <>
            <IconButton
              size="lg"
              sx={{
                borderRadius: "lg",
                boxShadow: "sm",
                fontSize: "1.5rem",
                "--IconButton-size": "3.25rem",
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(7px)",
                "&:hover": {
                  backgroundColor: "neutral.700",
                  color: "common.white",
                },
              }}
              {...bindTrigger(popupState)}
            >
              <LayerStyleIcon />
            </IconButton>
            <Popover
              {...bindPopover(popupState)}
              anchorOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              slotProps={{
                paper: {
                  sx: { boxShadow: "none", backgroundColor: "transparent" },
                },
              }}
            >
              <List
                size="md"
                variant="outlined"
                sx={{
                  minWidth: 250,
                  maxWidth: 300,
                  borderRadius: "sm",
                  backgroundColor: "background.body",
                }}
              >
                <ListItem
                  endAction={
                    <Switch
                      sx={{ mr: 1 }}
                      size="sm"
                      checked={checked}
                      variant={checked ? "solid" : "outlined"}
                      onChange={(event) => {
                        setChecked(event.target.checked);
                        setIsDiscrete(event.target.checked);
                      }}
                    />
                  }
                >
                  <ListItemDecorator>
                    <GradientIcon />
                  </ListItemDecorator>
                  <Typography
                    component="label"
                    color="primary.softColor"
                    level="title-sm"
                  >
                    Show edges
                  </Typography>
                </ListItem>

                <ListItem
                  endAction={
                    <Switch
                      sx={{ mr: 1 }}
                      size="sm"
                      checked={!checkedAnim}
                      variant={!checkedAnim ? "solid" : "outlined"}
                      onChange={(event) => {
                        setCheckedAnim(!event.target.checked);
                        setIsAnimHidden(!event.target.checked);
                      }}
                    />
                  }
                >
                  <ListItemDecorator>
                    <ParticlesIcon />
                  </ListItemDecorator>
                  <Typography
                    component="label"
                    color="primary.softColor"
                    level="title-sm"
                  >
                    Wind animation
                  </Typography>
                </ListItem>

                <ListItem
                  endAction={
                    <Switch
                      sx={{ mr: 1 }}
                      size="sm"
                      checked={checkedClip}
                      variant={checkedClip ? "solid" : "outlined"}
                      onChange={(event) => {
                        setCheckedClip(event.target.checked);
                        setIsLayerClipped(event.target.checked);
                      }}
                    />
                  }
                >
                  <ListItemDecorator>
                    <FontAwesomeIcon
                      icon={faScissors}
                      style={{ fontSize: "1rem" }}
                    />
                  </ListItemDecorator>
                  <Typography
                    component="label"
                    color="primary.softColor"
                    level="title-sm"
                  >
                    Clip weather map
                  </Typography>
                </ListItem>
              </List>
            </Popover>
          </>
        )}
      </PopupState>
    </Box>
  );
};

export default LayerOptionMenu;
