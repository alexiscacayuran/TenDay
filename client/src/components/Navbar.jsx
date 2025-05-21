import React, { useState } from "react";
import Geosearch from "./Geosearch";
import { useTheme } from "@mui/joy/styles";
import { useMediaQuery } from "@mui/material";
import Dexie from "dexie";
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
  Avatar,
  Card,
  CardContent,
  CardActions,
  Drawer,
  DialogTitle,
  ModalClose,
  DialogContent,
  FormControl,
  FormLabel,
  FormHelperText,
} from "@mui/joy";

import Logo from "../assets/logo/logo-rgb-light.png";
import LogoDark from "../assets/logo/logo-rgb-dark.png";
import {
  GIZLogo,
  BMUVIKILogo,
  PAGASALogo,
  TenDayLogoDark,
} from "./CustomIcons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faGear,
  faEnvelope,
  faPhone,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import Ana from "../assets/images/ana-portrait.jpg";

// Use existing Dexie instance for OverlayCache
const db = new Dexie("WeatherLayerCache");
db.version(1).stores({
  scalars: "url, scalarData",
  vectors: "url, vectorData",
});

const Navbar = ({
  arcgisToken,
  map,
  location,
  setLocation,
  setOpen,
  open,
  units,
  setUnits,
  scale,
  setScale,
  setIsLocationReady,
  selectedPolygon,
}) => {
  const theme = useTheme();
  const isBelowLaptop = useMediaQuery(theme.breakpoints.down("lg"));
  const [openSearch, setOpenSearch] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);

  console.log(theme.zIndex);

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
    <Box
      sx={{
        mt: 1,
        position: "absolute",
        display: "flex",
        justifyContent: !isBelowLaptop ? "space-between" : "flex-start",
        alignItems: "center",
        zIndex: theme.zIndex.navbar,
        width: "100vw",
        pointerEvents: "none",
      }}
    >
      <Stack
        direction={"row"}
        spacing={0}
        sx={{
          mx: "1.25rem",
          justifyContent: "flex-end",
          display: "flex",
          alignItems: "center",
          pointerEvents: "auto",
        }}
      >
        <IconButton color="inherit" sx={{ mr: 1 }}>
          <FontAwesomeIcon
            icon={faChevronLeft}
            style={{
              fontSize: "1.25rem",
              color: "white",
            }}
            onClick={() => {}}
          />
        </IconButton>

        <PAGASALogo />
        {
          !isBelowLaptop ? (
            <Stack
              direction="column"
              spacing={0}
              sx={{
                justifyContent: "center",
                alignItems: "flex-start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%", // Optional: ensures it doesn't overflow parent
                userSelect: "none",
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  lineHeight: 1.3,
                  fontSize: "0.6rem",
                  textShadow: "1.5px 1.5px 2px rgba(0, 0, 0, 0.5)",
                }}
              >
                Department of Science and Technology
              </Typography>
              <Typography
                sx={{
                  color: "white",
                  lineHeight: 1.2,
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                  textShadow: "1.5px 1.5px 2px rgba(0, 0, 0, 0.5)",
                }}
              >
                Philippine Atmospheric, Geophysical, and
                <br />
                Astronomical Services Administration
              </Typography>
            </Stack>
          ) : null
          // <Box
          //   sx={{
          //     whiteSpace: "nowrap",
          //     overflow: "hidden",
          //     textOverflow: "ellipsis",
          //     maxWidth: "100%",
          //   }}
          // >
          //   <Typography
          //     sx={{
          //       color: "white",
          //       lineHeight: 1.2,
          //       fontWeight: "bold",
          //       fontSize: "0.7rem",
          //       textShadow: "1.5px 1.5px 2px rgba(0, 0, 0, 0.5)",
          //     }}
          //   >
          //     DOST PAGASA
          //   </Typography>
          // </Box>
        }
      </Stack>

      <Stack
        direction="row"
        sx={{
          flexShrink: 1,
          minWidth: 0,
          maxWidth: "600px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Geosearch
          arcgisToken={arcgisToken}
          setLocation={setLocation}
          map={map}
          location={location}
          setOpen={setOpen}
          open={open}
          setIsLocationReady={setIsLocationReady}
          selectedPolygon={selectedPolygon}
        />
      </Stack>

      <Stack
        className="glass"
        direction="row"
        spacing={0}
        sx={{
          borderRadius: "lg",
          mx: "1.25rem",
          ml: isBelowLaptop ? "auto" : "0",
          px: "1rem",
          justifyContent: "flex-end",
          alignItems: "center",
          pointerEvents: "auto",
          boxShadow: "sm",
        }}
      >
        <Button color="inherit" variant="plain">
          <Typography
            level="title-md"
            sx={{
              // color: "var(--joy-palette-neutral-700, #32383E)",
              background: " #3E7BFF",
              background:
                "-webkit-linear-gradient(320deg,rgba(62, 123, 255, 1) 0%, #5C33E1)",
              fontWeight: "bolder",
              letterSpacing: "1px",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            API
          </Typography>
        </Button>
        {!isBelowLaptop ? (
          <Button
            size="lg"
            color="inherit"
            sx={{ px: "0.75rem" }}
            onClick={toggleSettingsDrawer(true)}
            startDecorator={
              <FontAwesomeIcon
                icon={faGear}
                style={{
                  fontSize: "1.25rem",
                  color: "var(--joy-palette-neutral-700, #32383E)",
                }}
              />
            }
          >
            Settings
          </Button>
        ) : (
          <IconButton
            size="lg"
            color="inherit"
            sx={{ px: "0.75rem" }}
            onClick={toggleSettingsDrawer(true)}
          >
            <FontAwesomeIcon
              icon={faGear}
              style={{
                fontSize: "1.25rem",
                color: "var(--joy-palette-neutral-700, #32383E)",
              }}
            />
          </IconButton>
        )}

        {!isBelowLaptop ? (
          <Button
            size="lg"
            color="inherit"
            sx={{ px: "0.75rem" }}
            onClick={toggleAboutDrawer(true)}
            startDecorator={
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{
                  fontSize: "1.25rem",
                  color: "var(--joy-palette-neutral-700, #32383E)",
                }}
              />
            }
          >
            About
          </Button>
        ) : (
          <IconButton
            size="lg"
            color="inherit"
            sx={{ px: "0.75rem" }}
            onClick={toggleAboutDrawer(true)}
          >
            <FontAwesomeIcon
              icon={faCircleInfo}
              style={{
                fontSize: "1.25rem",
                color: "var(--joy-palette-neutral-700, #32383E)",
              }}
            />
          </IconButton>
        )}
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
                onChange={(e, value) =>
                  value && setUnits({ ...units, temperature: value })
                }
              >
                <Button value="°C" sx={{ width: 120 }}>
                  °C
                </Button>
                <Button value="°F" sx={{ width: 120 }}>
                  °F
                </Button>
              </ToggleButtonGroup>
            </FormControl>

            {/* Rainfall Unit Selector */}
            <FormControl orientation="horizontal">
              <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                <FormLabel sx={{ typography: "title-sm" }}>Rainfall</FormLabel>
              </Box>
              <ToggleButtonGroup
                color="primary"
                size="sm"
                variant="outlined"
                value={units.rainfall}
                exclusive="true"
                onChange={(e, value) =>
                  value && setUnits({ ...units, rainfall: value })
                }
              >
                <Button value="mm/day" sx={{ width: 120 }}>
                  mm/day
                </Button>
                <Button value="in/day" sx={{ width: 120 }}>
                  in/day
                </Button>
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
                exclusive="true"
                onChange={(e, value) =>
                  value && setUnits({ ...units, windSpeed: value })
                }
              >
                <Button value="m/s" sx={{ width: 80 }}>
                  m/s
                </Button>
                <Button value="km/h" sx={{ width: 80 }}>
                  km/h
                </Button>
                <Button value="kt" sx={{ width: 80 }}>
                  knot
                </Button>
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
                exclusive="true"
                onChange={(e, value) =>
                  value && setUnits({ ...units, windDirection: value })
                }
              >
                <Button value="arrow" sx={{ width: 120 }}>
                  arrow
                </Button>
                <Button value="desc" sx={{ width: 120 }}>
                  description
                </Button>
              </ToggleButtonGroup>
            </FormControl>

            <FormControl orientation="horizontal" sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                <FormLabel sx={{ typography: "title-sm" }}>Map scale</FormLabel>
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
                exclusive="true"
                onChange={(e, value) => {
                  if (value === "metric") {
                    setScale({ metric: true, imperial: false });
                  } else if (value === "imperial") {
                    setScale({ metric: false, imperial: true });
                  }
                }}
              >
                <Button value="metric" sx={{ width: 120 }}>
                  km
                </Button>
                <Button value="imperial" sx={{ width: 120 }}>
                  mi
                </Button>
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
                spacing={1}
                sx={{
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <img
                  src="https://pubfiles.pagasa.dost.gov.ph/pagasaweb/images/pagasa-logo.png"
                  alt="NOAA"
                  height="40"
                  style={{ marginRight: 10 }}
                />
                <img src={LogoDark} alt="tenDay logo" height="35" />
              </Stack>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography level="body-md">
                TenDay is a{" "}
                <Typography sx={{ fontWeight: "bold" }}>
                  10-day climate forecast visualization app
                </Typography>{" "}
                that provides advance notice of potential hazards related to
                weather, climate and hydrological events for farmers and other
                socio-economic sectors.
              </Typography>
              <Typography level="body-md" sx={{ mt: 2 }}>
                This could serve as inputs/basis to formulate local climate
                advisory for farmers, fisherfolks and disaster preparedness.
              </Typography>

              <Typography level="body-md" sx={{ mt: 2 }}>
                This app is being updated every Monday, Wednesday, and Friday,
                PST by the Climate Monitoring and Prediction Section (CLIMPS)
                under the Climatology and Agrometeorology Division (CAD.)
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
                  System (GFS) produced by National Centers for Environmental
                  Prediction (NCEP). The details of its prediction system are
                  available
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
                For inquries and any particulars about the app, you may contact:
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
    </Box>
  );
};

export default Navbar;
