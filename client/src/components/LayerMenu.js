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

const LayerMenu = ({ overlay, setOverlay, isDiscrete, setIsDiscrete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [localOverlay, setLocalOverlay] = useState(overlay);
  const [checked, setChecked] = useState(isDiscrete);
  const [temp, setTemp] = useState("temperature_average");
  const [activeTooltip, setActiveTooltip] = useState("Temperature");

  const tooltipButtons = [
    { title: "Temperature", value: temp, icon: faTemperatureHalf },
    { title: "Rainfall", value: "rainfall", icon: faUmbrella },
    { title: "Humidity", value: "humidity", icon: faDroplet },
    { title: "Wind", value: "wind", icon: faWind },
    { title: "Clouds", value: "cloud", icon: faCloud },
  ];

  // Synchronize localOverlay with the parent prop
  useEffect(() => {
    setLocalOverlay(overlay);
  }, [overlay]);

  useEffect(() => {
    setChecked(isDiscrete);
  }, [isDiscrete]);

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
                setLocalOverlay(value); // Update local state for immediate UI change
                setOverlay(value); // Update parent state
                setIsMenuOpen((prev) =>
                  value.startsWith("temperature") ? !prev : false
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
                  onClick={() =>
                    setActiveTooltip(
                      activeTooltip === title ? activeTooltip : title
                    )
                  }
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
        {isMenuOpen && (
          <RadioGroup
            size="sm"
            overlay
            color="primary"
            variant="soft"
            sx={{ mt: 1 }}
          >
            <List
              component="div"
              variant="plain"
              sx={{
                minWidth: 160,
              }}
            >
              {["Maximum", "Average", "Minimum"].map((value, index) => (
                <React.Fragment key={value}>
                  {index !== 0 && <ListDivider />}
                  <ListItem>
                    <Radio
                      color="primary"
                      variant="outlined"
                      sx={{ flexGrow: 1, flexDirection: "row-reverse" }}
                      id={value}
                      value={"temperature_" + value.toLowerCase()}
                      label={<Typography level="title-sm">{value}</Typography>}
                      onChange={(e) => {
                        setTemp(e.target.value);
                        setLocalOverlay(e.target.value);
                        setOverlay(e.target.value);
                      }}
                      checked={temp === "temperature_" + value.toLowerCase()}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </RadioGroup>
        )}
      </Box>
    </>
  );
};

export default LayerMenu;
