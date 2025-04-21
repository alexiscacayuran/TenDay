import React, { useState } from "react";

import Geosearch from "./Geosearch";

import { AppBar, Toolbar } from "@mui/material";
import {
  Box,
  Button,
  IconButton,
  Sheet,
  Stack,
  Divider,
  Typography,
  ToggleButtonGroup,
  Link,
  Chip,
} from "@mui/joy";

import Avatar from "@mui/joy/Avatar";
import AvatarGroup from "@mui/joy/AvatarGroup";

import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";

import Logo from "../assets/logo/logo-rgb.png";

import {
  TanawPHLogo,
  GIZLogo,
  BMUVIKILogo,
  TanawPHLogoType,
} from "./CustomIcons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faGear,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import Ana from "../assets/images/ana-portrait.jpg";

import Drawer from "@mui/joy/Drawer";
import DialogTitle from "@mui/joy/DialogTitle";
import ModalClose from "@mui/joy/ModalClose";
import DialogContent from "@mui/joy/DialogContent";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";

import Dexie from "dexie";

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
  setOpen,
  open,
  units,
  setUnits,
  scale,
  setScale,
  setIsLocationReady,
  setIsPolygonHighlighted,
}) => {
  const [openSearch, setOpenSearch] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);

  const clearCache = async () => {
    await Promise.all([db.scalars.clear(), db.vectors.clear()]);
    // setCacheSize(0); // Reset size after clearing
  };

  const toggleSettingsDrawer = (inOpen) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setOpenSettings(inOpen);
  };

  const toggleAboutDrawer = (inOpen) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setOpenAbout(inOpen);
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
              location={location}
              setOpen={setOpen}
              open={open}
              setIsLocationReady={setIsLocationReady}
              setIsPolygonHighlighted={setIsPolygonHighlighted}
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
                onClick={toggleSettingsDrawer(true)}
              />
            </IconButton>

            <IconButton color="inherit">
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{
                  fontSize: "1.25rem",
                  color: "var(--joy-palette-neutral-700, #32383E)",
                }}
                onClick={toggleAboutDrawer(true)}
              />
            </IconButton>
          </Stack>
          <Drawer
            size="md"
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
              backdrop: {
                sx: {
                  backdropFilter: "none",
                  backgroundColor: "transparent",
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
                    <Button value="mm/day">mm/day</Button>
                    <Button value="in/day">in/day</Button>
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
                      Wind direction
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
                  onClick={() => {
                    clearCache();
                    window.location.reload();
                  }}
                >
                  Clear Cache
                </Button>
              </DialogContent>
            </Sheet>
          </Drawer>
          <Drawer
            size="md"
            anchor="right"
            open={openAbout}
            onClose={() => setOpenAbout(false)}
            slotProps={{
              content: {
                sx: {
                  bgcolor: "transparent",
                  p: { md: 3, sm: 0 },
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
                      icon={faCircleInfo}
                      style={{
                        color: "var(--joy-palette-neutral-700, #32383E)",
                      }}
                    />
                  }
                >
                  About
                </Typography>
              </DialogTitle>
              <ModalClose />
              <Divider sx={{ mt: "auto" }} />
              <DialogContent sx={{ gap: 2, p: 1 }}>
                <Box sx={{ mt: 3 }}>
                  <Stack
                    direction="row"
                    spacing={4}
                    sx={{
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                    }}
                  >
                    <img src={Logo} alt="10-Day Forecast Logo" height="50" />
                    {/* <img
                      src="https://pubfiles.pagasa.dost.gov.ph/pagasaweb/images/pagasa-logo.png"
                      alt="NOAA"
                      height="50"
                    /> */}
                  </Stack>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography level="body-md">
                    <TanawPHLogoType /> is a{" "}
                    <Typography sx={{ fontWeight: "bold" }}>
                      10-day forecast visualization app
                    </Typography>{" "}
                    that provides advance notice of potential hazards related to
                    weather, climate and hydrological events for farmers and
                    other socio-economic sectors.
                  </Typography>
                  <Typography level="body-md" sx={{ mt: 2 }}>
                    It could serve as inputs/basis to formulate local climate
                    advisory for farmers, fisherfolks and disaster preparedness.
                  </Typography>

                  <Typography level="body-sm" sx={{ mt: 2 }}>
                    This app is being updated every Monday, Wednesday, and
                    Friday, PST by the Climate Monitoring and Prediction Section
                    (CLIMPS) under the Climatology and Agrometeorology Division
                    (CAD.)
                  </Typography>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography level="title-lg">Data Sources</Typography>
                </Box>
                <Box>
                  <Stack
                    direction="row"
                    spacing={4}
                    sx={{
                      justifyContent: "center",
                      alignItems: "flex-start",
                    }}
                  >
                    {" "}
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/5/57/Noaa-logo-rgb-2022.svg"
                      alt="NOAA"
                      height="50"
                    />
                    <Typography level="body-md">
                      This product is based from the forecast of Global Forecast
                      System (GFS) produced by National Centers for
                      Environmental Prediction (NCEP). The details of its
                      prediction system are available
                      <Link
                        variant="plain"
                        href="https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs"
                        target="_blank"
                      >
                        {" "}
                        here.{" "}
                      </Link>
                    </Typography>
                  </Stack>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography level="title-lg">Contact</Typography>
                </Box>
                <Box>
                  <Typography level="body-md">
                    For inquries and any particulars about the app, you may
                    contact:
                  </Typography>
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        width: "auto",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                        }}
                      >
                        <Avatar
                          src={Ana}
                          size="lg"
                          slotProps={{
                            img: {
                              sx: {
                                height: "auto",
                              },
                            },
                          }}
                        />
                        <Stack
                          direction="column"
                          spacing={0}
                          sx={{
                            ml: 2,
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                          }}
                        >
                          <Typography level="title-lg">
                            Ana Liza S. Solis
                          </Typography>
                          <Typography level="body-sm">
                            Chief, Climate Monitoring and Prediction Section
                          </Typography>
                        </Stack>
                      </Box>
                      <CardContent>
                        <Typography level="body-sm">
                          Climatology and Agrometeorology Division
                        </Typography>
                        <Typography level="body-sm">DOST-PAGASA</Typography>
                      </CardContent>
                      <CardActions
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <Chip
                          variant="outlined"
                          color="primary"
                          size="sm"
                          startDecorator={<FontAwesomeIcon icon={faEnvelope} />}
                        >
                          asolis@pagasa.dost.gov.ph
                        </Chip>
                        <Chip
                          variant="outlined"
                          color="primary"
                          size="sm"
                          startDecorator={<FontAwesomeIcon icon={faPhone} />}
                          sx={{ mt: { lg: 1, xl: 0 } }}
                        >
                          (02) 8284-0800 loc. 4920/4921
                        </Chip>
                      </CardActions>
                    </Card>
                  </Box>

                  <Box sx={{ px: 1, mt: 4 }}>
                    <Typography level="body-md"></Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{
                        justifyContent: "center",
                        alignItems: "flex-start",
                      }}
                    >
                      <GIZLogo />
                      <BMUVIKILogo />
                    </Stack>
                  </Box>
                </Box>
              </DialogContent>
            </Sheet>
          </Drawer>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
