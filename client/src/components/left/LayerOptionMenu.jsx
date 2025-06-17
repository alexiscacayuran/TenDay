import React, { useState } from "react";
import { useMediaQuery } from "@mui/material";
import Popover from "@mui/material/Popover";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import {
  Box,
  Typography,
  Switch,
  IconButton,
  List,
  ListItem,
  ListItemDecorator,
} from "@mui/joy";

import {
  LayerStyleIcon,
  GradientIcon,
  ParticlesIcon,
} from "../utils/CustomIcons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScissors, faVectorSquare } from "@fortawesome/free-solid-svg-icons";

const LayerOptionMenu = ({
  isDiscrete,
  setIsDiscrete,
  isAnimHidden,
  setIsAnimHidden,
  isLayerClipped,
  setIsLayerClipped,
  isBoundaryHidden,
  setIsBoundaryHidden,
}) => {
  const [checked, setChecked] = useState(isDiscrete);
  const [checkedAnim, setCheckedAnim] = useState(isAnimHidden);
  const [checkedClip, setCheckedClip] = useState(isLayerClipped);
  const [checkedBoundary, setCheckedBoundary] = useState(isBoundaryHidden);

  const isLaptop = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <PopupState variant="popover">
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
            anchorOrigin={
              isLaptop
                ? {
                    vertical: "top",
                    horizontal: "left",
                  }
                : {
                    vertical: "bottom",
                    horizontal: "right",
                  }
            }
            transformOrigin={
              isLaptop
                ? {
                    vertical: "top",
                    horizontal: "left",
                  }
                : {
                    vertical: "bottom",
                    horizontal: "right",
                  }
            }
            slotProps={{
              paper: {
                sx: { boxShadow: "none", backgroundColor: "transparent" },
              },
            }}
          >
            <List
              size="md"
              color="neutral"
              variant="solid"
              sx={{
                minWidth: 250,
                maxWidth: 300,
                borderRadius: "sm",
              }}
            >
              <ListItem
                endAction={
                  <Switch
                    sx={{ mr: 1 }}
                    size="sm"
                    checked={checked}
                    color={checked ? "primary" : "neutral"}
                    variant={checked ? "solid" : "outlined"}
                    onChange={(event) => {
                      setChecked(event.target.checked);
                      setIsDiscrete(event.target.checked);
                    }}
                    slotProps={
                      !checked
                        ? {
                            track: {
                              sx: { backgroundColor: "neutral.500" },
                            },
                            thumb: {
                              sx: { backgroundColor: "common.white" },
                            },
                          }
                        : {}
                    }
                  />
                }
              >
                <ListItemDecorator sx={{ color: "common.white" }}>
                  <GradientIcon />
                </ListItemDecorator>
                <Typography
                  component="label"
                  level="title-sm"
                  sx={{ color: "common.white" }}
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
                    color={!checkedAnim ? "primary" : "neutral"}
                    variant={!checkedAnim ? "solid" : "outlined"}
                    onChange={(event) => {
                      setCheckedAnim(!event.target.checked);
                      setIsAnimHidden(!event.target.checked);
                    }}
                    slotProps={
                      checkedAnim
                        ? {
                            track: {
                              sx: { backgroundColor: "neutral.500" },
                            },
                            thumb: {
                              sx: { backgroundColor: "common.white" },
                            },
                          }
                        : {}
                    }
                  />
                }
              >
                <ListItemDecorator sx={{ color: "common.white" }}>
                  <ParticlesIcon />
                </ListItemDecorator>
                <Typography
                  component="label"
                  sx={{ color: "common.white" }}
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
                    color={checkedClip ? "primary" : "neutral"}
                    variant={checkedClip ? "solid" : "outlined"}
                    onChange={(event) => {
                      setCheckedClip(event.target.checked);
                      setIsLayerClipped(event.target.checked);
                    }}
                    slotProps={
                      !checkedClip
                        ? {
                            track: {
                              sx: { backgroundColor: "neutral.500" },
                            },
                            thumb: {
                              sx: { backgroundColor: "common.white" },
                            },
                          }
                        : {}
                    }
                  />
                }
              >
                <ListItemDecorator sx={{ color: "common.white" }}>
                  <FontAwesomeIcon
                    icon={faScissors}
                    style={{ fontSize: "1rem" }}
                  />
                </ListItemDecorator>
                <Typography
                  component="label"
                  sx={{ color: "common.white" }}
                  level="title-sm"
                >
                  Clip weather map
                </Typography>
              </ListItem>

              <ListItem
                endAction={
                  <Switch
                    sx={{ mr: 1 }}
                    size="sm"
                    checked={checkedBoundary}
                    color={checkedBoundary ? "primary" : "neutral"}
                    variant={checkedBoundary ? "solid" : "outlined"}
                    onChange={(event) => {
                      setCheckedBoundary(event.target.checked);
                      setIsBoundaryHidden(event.target.checked);
                    }}
                    slotProps={
                      !checkedBoundary
                        ? {
                            track: {
                              sx: { backgroundColor: "neutral.500" },
                            },
                            thumb: {
                              sx: { backgroundColor: "common.white" },
                            },
                          }
                        : {}
                    }
                  />
                }
              >
                <ListItemDecorator sx={{ color: "common.white" }}>
                  <FontAwesomeIcon
                    icon={faVectorSquare}
                    style={{ fontSize: "1rem" }}
                  />
                </ListItemDecorator>
                <Typography
                  component="label"
                  sx={{ color: "common.white" }}
                  level="title-sm"
                >
                  Show boundaries
                </Typography>
              </ListItem>
            </List>
          </Popover>
        </>
      )}
    </PopupState>
  );
};

export default LayerOptionMenu;
