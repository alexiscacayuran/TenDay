import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTemperatureHalf,
  faTemperatureFull,
  faTemperatureEmpty,
  faDroplet,
  faWind,
  faUmbrella,
  faCloud,
} from "@fortawesome/free-solid-svg-icons";

import Sheet from "@mui/joy/Sheet";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListDivider from "@mui/joy/ListDivider";
import Radio from "@mui/joy/Radio";
import RadioGroup from "@mui/joy/RadioGroup";
import Typography from "@mui/joy/Typography";
import Tooltip from "@mui/joy/Tooltip";
import Switch from "@mui/joy/Switch";
import LayerOptionMenu from "./LayerOptionMenu";
import Grow from "@mui/material/Grow";
import { TransitionGroup } from "react-transition-group";

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
    { title: "Rainfall", value: "rainfall", icon: faUmbrella },
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
    { title: "Average", value: "temperature_average", icon: <TMeanIcon /> },
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
          color="primary"
          variant="soft"
          sx={{ borderRadius: "md", display: "inline-flex", gap: 2, p: 0.5 }}
        >
          <ToggleButtonGroup
            size="lg"
            orientation="vertical"
            color="primary"
            variant="soft"
            spacing={0.5}
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
        <Box
          sx={{
            position: "relative",
            minHeight: isMenuOpen ? "155px" : "auto",
            transition: "min-height 0.3s ease",
            mt: 1,
          }}
        >
          <Grow in={isMenuOpen} timeout={300}>
            <Sheet
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
                color="primary"
                variant="soft"
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
                  <IconButton
                    key={title}
                    value={value}
                    aria-label={value}
                    onClick={() => setActiveTooltip("Temperature")}
                  >
                    {icon}
                  </IconButton>
                ))}
              </ToggleButtonGroup>
            </Sheet>
          </Grow>
        </Box>
        <LayerOptionMenu
          setIsDiscrete={setIsDiscrete}
          isDiscrete={isDiscrete}
          setIsAnimHidden={setIsAnimHidden}
          isAnimHidden={isAnimHidden}
          setIsLayerClipped={setIsLayerClipped}
          isLayerClipped={isLayerClipped}
        />
      </Box>
    </>
  );
};

export default LayerMenu;
