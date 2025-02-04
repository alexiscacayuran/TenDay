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

const OverlayMenu = ({ overlay, setOverlay }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [localOverlay, setLocalOverlay] = useState(overlay);
  const [temp, setTemp] = useState("temperature_average");
  const [activeTooltip, setActiveTooltip] = useState("Temperature");
  console.log(activeTooltip);

  const tooltipButtons = [
    { title: "Temperature", value: temp, icon: faTemperatureHalf },
    { title: "Humidity", value: "humidity", icon: faDroplet },
    { title: "Wind", value: "wind", icon: faWind },
    { title: "Rainfall", value: "rainfall", icon: faUmbrella },
    { title: "Clouds", value: "cloud", icon: faCloud },
  ];

  // Synchronize localOverlay with the parent prop
  useEffect(() => {
    setLocalOverlay(overlay);
  }, [overlay]);

  return (
    <>
      <Box sx={{ position: "absolute", top: 60, left: 10 }}>
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
                sx={{ fontWeight: 600 }}
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
      </Box>
      {isMenuOpen && (
        <Box sx={{ position: "absolute", top: 310, left: 10 }}>
          <RadioGroup
            size="sm"
            aria-labelledby="example-payment-channel-label"
            overlay
            color="primary"
            variant="soft"
            name="example-payment-channel"
            defaultValue="Paypal"
          >
            <List
              component="div"
              variant="plain"
              sx={{
                minWidth: 120,
              }}
            >
              {["Average", "Minimum", "Maximum"].map((value, index) => (
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
        </Box>
      )}
    </>
  );
};

export default OverlayMenu;
