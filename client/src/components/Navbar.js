import React, { useState, useEffect } from "react";

import Geosearch from "./Geosearch";

import { AppBar, Toolbar } from "@mui/material";
import {
  Box,
  Button,
  IconButton,
  Sheet,
  Modal,
  Tooltip,
  ButtonGroup,
  Stack,
  Divider,
  Typography,
  ToggleButtonGroup,
} from "@mui/joy";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import Logo from "../assets/logo-text.png";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faGear } from "@fortawesome/free-solid-svg-icons";

import Input from "@mui/joy/Input";
import Drawer from "@mui/joy/Drawer";
import DialogTitle from "@mui/joy/DialogTitle";
import ModalClose from "@mui/joy/ModalClose";
import DialogContent from "@mui/joy/DialogContent";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";

import Dexie from "dexie";

import L from "leaflet";
import { DivIcon } from "leaflet";

// Use existing Dexie instance for OverlayCache
const db = new Dexie("WeatherLayerCache");
db.version(1).stores({
  scalars: "url, scalarData",
  vectors: "url, vectorData",
});

const Navbar = ({
  accessToken,
  map,
  markerLayer,
  location,
  setLocation,
  setOpenContainer,
  openContainer,
  units,
  setUnits,
  setIsLocateUsed,
  scale,
  setScale,
}) => {
  const [openSearch, setOpenSearch] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);

  const clearCache = async () => {
    await Promise.all([db.scalars.clear(), db.vectors.clear()]);
    // setCacheSize(0); // Reset size after clearing
  };

  const toggleDrawer = (inOpen) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setOpenSettings(inOpen);
  };
  return (
    <Box>
      <AppBar
        position="fixed"
        className="glass"
        elevation={0}
        color="transparent"
      >
        <Toolbar className="app-bar">
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{
              mr: 2,
              color: "primaryvar(--joy-palette-primary-500, #0B6BCB)",
            }}
          >
            <MenuIcon />
          </IconButton> */}
          <Box sx={{ mr: 4, flexGrow: 0, pt: "0.3em" }}>
            <img src={Logo} alt="10-Day Forecast Logo" height="40" />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Geosearch
              accessToken={accessToken}
              setLocation={setLocation}
              map={map}
              markerLayer={markerLayer}
              location={location}
              setOpenModal={setOpenSearch}
              setOpenContainer={setOpenContainer}
              openContainer={openContainer}
              setIsLocateUsed={setIsLocateUsed}
            />
          </Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconButton color="inherit">
              <FontAwesomeIcon
                icon={faGear}
                style={{
                  fontSize: "1.25rem",
                  color: "var(--joy-palette-neutral-700, #32383E)",
                }}
                onClick={toggleDrawer(true)}
              />
            </IconButton>

            <IconButton color="inherit">
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{
                  fontSize: "1.25rem",
                  color: "var(--joy-palette-neutral-700, #32383E)",
                }}
              />
            </IconButton>
          </Stack>
          <Drawer
            size="sm"
            anchor="right"
            open={openSettings}
            onClose={() => setOpenSettings(false)}
            slotProps={{
              content: {
                sx: {
                  bgcolor: "transparent",
                  p: { md: 3, sm: 0 },
                  boxShadow: "none",
                },
              },
            }}
          >
            <Sheet
              sx={{
                borderRadius: "md",
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                overflow: "auto",
              }}
            >
              <DialogTitle>
                <Typography
                  startDecorator={
                    <FontAwesomeIcon
                      icon={faGear}
                      style={{
                        color: "var(--joy-palette-neutral-700, #32383E)",
                      }}
                    />
                  }
                >
                  Settings
                </Typography>
              </DialogTitle>
              <ModalClose />
              <Divider sx={{ mt: "auto" }} />
              <DialogContent sx={{ gap: 2 }}>
                <Typography level="title-md" sx={{ fontWeight: "bold", mt: 1 }}>
                  Units and measurements
                </Typography>
                {/* Temperature Unit Selector */}
                <FormControl orientation="horizontal">
                  <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                    <FormLabel sx={{ typography: "title-sm" }}>
                      Temperature
                    </FormLabel>
                  </Box>
                  <ToggleButtonGroup
                    color="primary"
                    size="sm"
                    variant="outlined"
                    value={units.temperature}
                    exclusive
                    onChange={(e, value) =>
                      value && setUnits({ ...units, temperature: value })
                    }
                  >
                    <Button value="°C">°C</Button>
                    <Button value="°F">°F</Button>
                  </ToggleButtonGroup>
                </FormControl>

                {/* Rainfall Unit Selector */}
                <FormControl orientation="horizontal">
                  <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                    <FormLabel sx={{ typography: "title-sm" }}>
                      Rainfall
                    </FormLabel>
                  </Box>
                  <ToggleButtonGroup
                    color="primary"
                    size="sm"
                    variant="outlined"
                    value={units.rainfall}
                    exclusive
                    onChange={(e, value) =>
                      value && setUnits({ ...units, rainfall: value })
                    }
                  >
                    <Button value="mm/24h">mm/24h</Button>
                    <Button value="in/24h">in/24h</Button>
                  </ToggleButtonGroup>
                </FormControl>

                {/* Wind Unit Selector */}
                <FormControl orientation="horizontal">
                  <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                    <FormLabel sx={{ typography: "title-sm" }}>
                      Wind speed
                    </FormLabel>
                  </Box>
                  <ToggleButtonGroup
                    color="primary"
                    size="sm"
                    variant="outlined"
                    value={units.windSpeed}
                    exclusive
                    onChange={(e, value) =>
                      value && setUnits({ ...units, windSpeed: value })
                    }
                  >
                    <Button value="m/s">m/s</Button>
                    <Button value="km/h">km/h</Button>
                    <Button value="kt">knot</Button>
                  </ToggleButtonGroup>
                </FormControl>

                {/* Wind Unit Selector */}
                <FormControl orientation="horizontal">
                  <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                    <FormLabel sx={{ typography: "title-sm" }}>
                      Wind speed
                    </FormLabel>
                  </Box>
                  <ToggleButtonGroup
                    color="primary"
                    size="sm"
                    variant="outlined"
                    value={units.windDirection}
                    exclusive
                    onChange={(e, value) =>
                      value && setUnits({ ...units, windDirection: value })
                    }
                  >
                    <Button value="arrow">arrow</Button>
                    <Button value="desc">description</Button>
                  </ToggleButtonGroup>
                </FormControl>

                <FormControl orientation="horizontal" sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                    <FormLabel sx={{ typography: "title-sm" }}>
                      Map scale
                    </FormLabel>
                  </Box>
                  <ToggleButtonGroup
                    color="primary"
                    size="sm"
                    variant="outlined"
                    value={
                      scale.metric
                        ? "metric"
                        : scale.imperial
                        ? "imperial"
                        : undefined
                    }
                    exclusive
                    onChange={(e, value) => {
                      if (value === "metric") {
                        setScale({ metric: true, imperial: false });
                      } else if (value === "imperial") {
                        setScale({ metric: false, imperial: true });
                      }
                    }}
                  >
                    <Button value="metric">km</Button>
                    <Button value="imperial">mi</Button>
                  </ToggleButtonGroup>
                </FormControl>

                <Typography level="title-md" sx={{ fontWeight: "bold", mt: 2 }}>
                  Data management
                </Typography>
                <FormControl orientation="horizontal">
                  <Box sx={{ flex: 1, pr: 1 }}>
                    <FormLabel sx={{ typography: "title-sm" }}>
                      Clear app cache
                    </FormLabel>
                    <FormHelperText sx={{ typography: "body-sm" }}>
                      This will delete all the temporary weather data in your
                      browser.
                    </FormHelperText>
                  </Box>
                </FormControl>
                <Button
                  variant="solid"
                  color="danger"
                  size="sm"
                  onClick={clearCache}
                >
                  Clear Cache
                </Button>
              </DialogContent>
            </Sheet>
          </Drawer>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
