import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTemperatureHalf,
  faDroplet,
  faWind,
  faCloudShowersHeavy,
  faCloud,
  faChevronDown,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@mui/joy/styles";
import { useMediaQuery } from "@mui/material";
import {
  Button,
  Sheet,
  Box,
  IconButton,
  ToggleButtonGroup,
  Tooltip,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemDecorator,
} from "@mui/joy";

import LayerOptionMenu from "./LayerOptionMenu";
import { useAnimation, motion } from "framer-motion";

import { TMaxIcon, TMeanIcon, TMinIcon } from "../utils/CustomIcons";

import Search from "../header/Search";
import Issuance from "../right/Issuance";

const LayerMenu = ({
  overlay,
  setOverlay,
  isDiscrete,
  setIsDiscrete,
  isAnimHidden,
  setIsAnimHidden,
  isMenuOpen,
  setIsMenuOpen,
  temp,
  setTemp,
  activeTooltip,
  setActiveTooltip,
  isLayerClipped,
  setIsLayerClipped,
  openContainer,
  setOpenContainer,
  arcgisToken,
  setLocation,
  map,
  setIsLocationReady,
  selectedPolygon,
  isBoundaryHidden,
  setIsBoundaryHidden,
  startDate,
}) => {
  const [localOverlay, setLocalOverlay] = useState(overlay);
  const [localTemp, setLocalTemp] = useState(temp);
  const isLaptop = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [open, setOpen] = useState(false);

  const MotionBox = motion(Box);
  const MotionStack = motion(Stack);
  const controls = useAnimation();
  const lastY = useRef(0);

  useEffect(() => {
    const newY = openContainer ? -160 : 0;

    if (lastY.current !== newY) {
      lastY.current = newY;
      controls.start({
        y: newY,
        transition: { type: "tween", duration: 0.3 },
      });
    }
  }, [openContainer, controls]);

  const tooltipButtons = [
    { title: "Temperature", value: temp, icon: faTemperatureHalf },
    { title: "Rainfall", value: "rainfall", icon: faCloudShowersHeavy },
    { title: "Humidity", value: "humidity", icon: faDroplet },
    { title: "Wind", value: "wind", icon: faWind },
    { title: "Clouds", value: "cloud", icon: faCloud },
  ];

  const tempButtons = [
    {
      title: "Maximum",
      value: "temperature_maximum",
      icon: <TMaxIcon sx={{ fontSize: "1.5rem" }} />,
    },
    {
      title: "Mean",
      value: "temperature_mean",
      icon: <TMeanIcon sx={{ fontSize: "1.5rem" }} />,
    },
    {
      title: "Minimum",
      value: "temperature_minimum",
      icon: <TMinIcon sx={{ fontSize: "1.5rem" }} />,
    },
  ];

  const sidebarButtons = [
    {
      title: "Max Temp",
      value: "temperature_maximum",
      icon: <TMaxIcon sx={{ fontSize: "1.5rem" }} />,
    },
    {
      title: "Mean Temp",
      value: "temperature_mean",
      icon: <TMeanIcon sx={{ fontSize: "1.5rem" }} />,
    },
    {
      title: "Min Temp",
      value: "temperature_minimum",
      icon: <TMinIcon sx={{ fontSize: "1.5rem" }} />,
    },
    {
      title: "Rainfall",
      value: "rainfall",
      icon: (
        <FontAwesomeIcon
          icon={faCloudShowersHeavy}
          style={{ fontSize: "1.25rem" }}
        />
      ),
    },
    {
      title: "Humidity",
      value: "humidity",
      icon: (
        <FontAwesomeIcon icon={faDroplet} style={{ fontSize: "1.25rem" }} />
      ),
    },
    {
      title: "Wind",
      value: "wind",
      icon: <FontAwesomeIcon icon={faWind} style={{ fontSize: "1.25rem" }} />,
    },
    {
      title: "Clouds",
      value: "cloud",
      icon: <FontAwesomeIcon icon={faCloud} style={{ fontSize: "1.25rem" }} />,
    },
  ];

  const handleInfo = () => {
    return null;
  };

  return (
    <>
      {isTablet ? (
        <Box sx={{ position: "absolute", top: 70, left: 10, zIndex: 1200 }}>
          <Sheet
            className="glass"
            color="primary"
            variant="soft"
            sx={{
              borderRadius: "lg",
              display: "inline-flex",
              gap: 2,
              p: 0.5,
              boxShadow: "sm",
              mb: 1,
            }}
          >
            <ToggleButtonGroup
              size="lg"
              orientation="vertical"
              color="neutral"
              variant="solid"
              spacing={0.5}
              sx={{ borderRadius: "md" }}
              value={localOverlay}
              onChange={(event, value) => {
                if (value) {
                  setLocalOverlay(value);
                  setOverlay(value);
                  setIsMenuOpen(value.startsWith("temperature"));
                  setActiveTooltip(
                    tooltipButtons.find((btn) => btn.value === value)?.title ||
                      ""
                  );
                }
              }}
              aria-label="overlay"
            >
              {tooltipButtons.map(({ title, value, icon }) => (
                <Tooltip
                  key={title}
                  title={title}
                  open={activeTooltip === title}
                  placement="right"
                  size="lg"
                  variant="soft"
                  sx={{ fontWeight: 600, zIndex: 500 }}
                >
                  <IconButton
                    value={value}
                    aria-label={value}
                    onClick={() => setActiveTooltip(title)}
                    sx={{
                      backgroundColor: "transparent",
                      "&[aria-pressed=false]": { color: "neutral.700" },
                      "&[aria-pressed=false]:hover": {
                        backgroundColor: "transparent",
                      },
                      "&[aria-pressed=false]:focus": {
                        backgroundColor: "neutral.500",
                        color: "white",
                      },
                    }}
                  >
                    <FontAwesomeIcon
                      icon={icon}
                      style={{ fontSize: "1.25rem" }}
                    />
                  </IconButton>
                </Tooltip>
              ))}
            </ToggleButtonGroup>
          </Sheet>
          {/* Box Container with Collapse Animation (Height Only, Smoother Transition) */}
          <motion.div
            initial={{ height: 0 }}
            animate={{
              height: isMenuOpen ? "155px" : 0,
            }}
            exit={{ height: 0 }}
            transition={{
              duration: 0.5, // Increased duration for smoother effect
              ease: [0.25, 1, 0.5, 1], // Smooth spring-like easing
            }}
            style={{
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Sheet
              className="glass"
              color="primary"
              variant="soft"
              sx={{
                borderRadius: "lg",
                display: "inline-flex",
                gap: 2,
                p: 0.5,
                position: "absolute",
                boxShadow: "sm",
              }}
            >
              {/* Temp Button Group Sheet (Slide + Smoother) */}
              <motion.div
                initial={{ y: 15 }}
                animate={{
                  y: 0,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.33, 1, 0.68, 1], // More natural easing curve
                }}
              >
                <ToggleButtonGroup
                  size="lg"
                  orientation="vertical"
                  color="neutral"
                  variant="solid"
                  spacing={0.5}
                  value={localTemp}
                  sx={{ borderRadius: "md" }}
                  onChange={(event, value) => {
                    if (value) {
                      setTemp(value);
                      setLocalTemp(value);
                      setLocalOverlay(value);
                      setOverlay(value);
                      setActiveTooltip("Temperature");
                    }
                  }}
                  aria-label="temp-overlay"
                >
                  {tempButtons.map(({ title, value, icon }) => (
                    <Tooltip
                      key={title}
                      title={title}
                      placement="right"
                      size="lg"
                      variant="soft"
                      sx={{ fontWeight: 600, zIndex: 500 }}
                    >
                      <IconButton
                        key={title}
                        value={value}
                        aria-label={value}
                        sx={{
                          backgroundColor: "transparent",
                          "&[aria-pressed=false]": { color: "neutral.700" },
                          "&[aria-pressed=false]:hover": {
                            backgroundColor: "transparent",
                          },
                          "&[aria-pressed=false]:focus": {
                            backgroundColor: "neutral.500",
                            color: "white",
                          },
                        }}
                        onClick={() => setActiveTooltip("Temperature")}
                      >
                        {icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </ToggleButtonGroup>
              </motion.div>
            </Sheet>
          </motion.div>

          <LayerOptionMenu
            setIsDiscrete={setIsDiscrete}
            isDiscrete={isDiscrete}
            setIsAnimHidden={setIsAnimHidden}
            isAnimHidden={isAnimHidden}
            setIsLayerClipped={setIsLayerClipped}
            isLayerClipped={isLayerClipped}
            isBoundaryHidden={isBoundaryHidden}
            setIsBoundaryHidden={setIsBoundaryHidden}
          />
        </Box>
      ) : (
        <>
          <MotionBox
            animate={controls}
            initial={{ y: lastY.current }}
            sx={{ position: "absolute", bottom: 90, left: 10, zIndex: 1200 }}
          >
            <Button
              className="glass"
              onClick={() => setOpen(true)}
              sx={{
                boxShadow: "sm",
                color: "neutral.700",
                borderRadius: "lg",
                py: 1.5,
                px: 2,
                position: "relative",
                minWidth: !openContainer ? 110 : 70,
                "&:active": {
                  color: "white",
                  backgroundColor: "#32383E !important",
                },
                justifyContent: "flex-start",
              }}
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 5,
                  fontSize: "1rem",
                }}
              />
              <Stack
                direction="column"
                spacing={0}
                sx={{
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  mr: 2,
                }}
              >
                {
                  (
                    sidebarButtons.find(
                      (button) => button.value === localOverlay
                    ) || {}
                  ).icon
                }
                {!openContainer &&
                  (
                    sidebarButtons.find(
                      (button) => button.value === localOverlay
                    ) || {}
                  ).title}
              </Stack>
            </Button>
          </MotionBox>
          <Drawer
            size="sm"
            anchor="left"
            open={open}
            onClose={() => {
              setOpen(false);
            }}
            sx={{}}
            slotProps={{
              content: {
                sx: {
                  bgcolor: "transparent",
                  p: { md: 1, xs: 0 },
                  boxShadow: "none",
                },
              },
              backdrop: {
                sx: {
                  backdropFilter: "none",
                  backgroundColor: "transparent",
                },
              },
            }}
          >
            <Sheet
              color="neutral"
              variant="solid"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                overflow: "auto",
                justifyContent: "flex-end",
              }}
            >
              <Box role="presentation" sx={{ p: 2 }}>
                <List>
                  {sidebarButtons.map(({ title, value, icon }) => (
                    <ListItem key={title} sx={{ py: 1 }}>
                      <ListItemButton
                        color="neutral"
                        variant="solid"
                        onClick={() => {
                          setLocalOverlay(value);
                          setOverlay(value);
                          setOpen(false);
                        }}
                        sx={{
                          borderRadius: "sm",
                          '&:not(.Mui-selected, [aria-selected="true"]):hover':
                            {
                              backgroundColor: "neutral.700",
                              borderRadius: "sm",
                            },
                          '&:not(.Mui-selected, [aria-selected="true"]):active':
                            {
                              backgroundColor: "neutral.700",
                              borderRadius: "sm",
                            },
                        }}
                      >
                        <ListItemDecorator sx={{ color: "primary.400" }}>
                          {icon}
                        </ListItemDecorator>
                        {title}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Sheet>
          </Drawer>
          <MotionStack
            animate={controls}
            initial={{ y: lastY.current }}
            spacing={1}
            sx={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bottom: 90,
              right: 10,
              zIndex: 1200,
            }}
          >
            <Issuance context="mobile" startDate={startDate} />
            <Search
              arcgisToken={arcgisToken}
              setLocation={setLocation}
              map={map}
              setOpen={setOpenContainer}
              setIsLocationReady={setIsLocationReady}
              selectedPolygon={selectedPolygon}
              isLocateOnly="true"
            />
            <LayerOptionMenu
              setIsDiscrete={setIsDiscrete}
              isDiscrete={isDiscrete}
              setIsAnimHidden={setIsAnimHidden}
              isAnimHidden={isAnimHidden}
              setIsLayerClipped={setIsLayerClipped}
              isLayerClipped={isLayerClipped}
              isBoundaryHidden={isBoundaryHidden}
              setIsBoundaryHidden={setIsBoundaryHidden}
            />
          </MotionStack>
        </>
      )}
    </>
  );
};

export default LayerMenu;
