import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTemperatureHalf,
  faDroplet,
  faWind,
  faCloudShowersHeavy,
  faCloud,
} from "@fortawesome/free-solid-svg-icons";

import Sheet from "@mui/joy/Sheet";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Tooltip from "@mui/joy/Tooltip";
import LayerOptionMenu from "./LayerOptionMenu";
import { motion } from "framer-motion";

import { TMaxIcon, TMeanIcon, TMinIcon } from "./CustomIcons";

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
}) => {
  const [localOverlay, setLocalOverlay] = useState(overlay);
  const [localTemp, setLocalTemp] = useState();

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
      icon: <TMaxIcon />,
    },
    { title: "Mean", value: "temperature_mean", icon: <TMeanIcon /> },
    { title: "Minimum", value: "temperature_minimum", icon: <TMinIcon /> },
  ];

  useEffect(() => {
    setLocalOverlay(overlay);
  }, [overlay]);

  useEffect(() => {
    setLocalTemp(temp);
  }, [temp]);

  return (
    <>
      <Box sx={{ position: "absolute", top: 60, left: 10, zIndex: 999 }}>
        <Sheet
          className="glass"
          color="primary"
          variant="soft"
          sx={{ borderRadius: "md", display: "inline-flex", gap: 2, p: 0.5 }}
        >
          <ToggleButtonGroup
            size="lg"
            orientation="vertical"
            color="neutral"
            variant="solid"
            spacing={0.5}
            sx={{}}
            value={localOverlay}
            onChange={(event, value) => {
              if (value) {
                setLocalOverlay(value);
                setOverlay(value);
                setIsMenuOpen(value.startsWith("temperature"));
                setActiveTooltip(
                  tooltipButtons.find((btn) => btn.value === value)?.title || ""
                ); // Sync tooltip
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
            marginTop: isMenuOpen ? "8px" : 0,
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
          {/* Temp Button Group Sheet (Slide + Smoother) */}
          <motion.div
            initial={{ y: -15 }}
            animate={{
              y: isMenuOpen ? 0 : -15,
            }}
            transition={{
              duration: 0.4,
              ease: [0.33, 1, 0.68, 1], // More natural easing curve
            }}
          >
            <Sheet
              className="glass"
              color="primary"
              variant="soft"
              sx={{
                borderRadius: "md",
                display: "inline-flex",
                gap: 2,
                p: 0.5,
                position: "absolute",
              }}
            >
              <ToggleButtonGroup
                size="lg"
                orientation="vertical"
                color="neutral"
                variant="solid"
                spacing={0.5}
                value={localTemp}
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
            </Sheet>
          </motion.div>
        </motion.div>

        {/* LayerOptionMenu with Slide Up/Down (Super Smooth!) */}
        <motion.div
          initial={{ y: 20 }}
          animate={{
            y: isMenuOpen ? 0 : 10,
          }}
          transition={{
            duration: 0.5,
            ease: [0.33, 1, 0.68, 1], // Bezier easing for smoother feel
          }}
        >
          <LayerOptionMenu
            setIsDiscrete={setIsDiscrete}
            isDiscrete={isDiscrete}
            setIsAnimHidden={setIsAnimHidden}
            isAnimHidden={isAnimHidden}
            setIsLayerClipped={setIsLayerClipped}
            isLayerClipped={isLayerClipped}
          />
        </motion.div>
      </Box>
    </>
  );
};

export default LayerMenu;
