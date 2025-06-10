import React, { useState } from "react";
import Header from "./Header";
import Search from "./Search";
import Settings from "./Settings";
import About from "./About";
import { PAGASALogo } from "../utils/CustomIcons";
import { useTheme } from "@mui/joy/styles";
import { useMediaQuery } from "@mui/material";
import Dexie from "dexie";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  DialogContent,
  Modal,
  ModalDialog,
} from "@mui/joy";

import Logo from "../../assets/logo/logo-rgb-light.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faSearch,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "./Sidebar";

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
  const isBelowLaptop = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [searchLayout, setSearchLayout] = useState(undefined);

  return (
    <>
      {!isMobile ? (
        <Box
          sx={{
            mt: 1,
            position: "absolute",
            display: "flex",
            justifyContent: !isBelowLaptop ? "space-between" : "flex-start",
            alignItems: !isBelowLaptop ? "flex-start" : "center",
            zIndex: theme.zIndex.navbar,
            width: "100vw",
            pointerEvents: "none",
          }}
        >
          <Stack
            component="span"
            onClick={() =>
              window.open(
                "https://www.pagasa.dost.gov.ph/",
                "_blank",
                "noopener,noreferrer"
              )
            }
            direction="row"
            spacing={0}
            sx={{
              cursor: "pointer",
              ml: "1.25rem",
              mr: !isBelowLaptop ? "1.25rem" : 0,
              justifyContent: "flex-end",
              display: "flex",
              alignItems: "center",
              pointerEvents: "auto",
            }}
          >
            {/* <IconButton color="inherit" sx={{ mr: 1 }}>
              <FontAwesomeIcon
                icon={faChevronLeft}
                style={{
                  fontSize: "1.25rem",
                  color: "white",
                }}
                onClick={() => {}}
              />
            </IconButton> */}

            <PAGASALogo
              style={{
                height: !isBelowLaptop ? "40px" : "35px",
                marginRight: 10,
              }}
            />

            {!isBelowLaptop ? (
              <Typography
                sx={{
                  color: "white",
                  lineHeight: 1.2,
                  fontWeight: "bold",
                  fontSize: "1rem",
                  textShadow: "1.5px 1.5px 2px rgba(0, 0, 0, 0.5)",
                }}
              >
                DOST-PAGASA
              </Typography>
            ) : null}
          </Stack>

          <Stack
            direction="row"
            sx={{
              flexShrink: 1,
              flexGrow: 1,
              minWidth: 0,
              maxWidth: "600px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Header
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
            <Button color="inherit">
              <Typography
                level="title-md"
                sx={{
                  background:
                    "-webkit-linear-gradient(320deg,rgba(62, 123, 255, 1) 0%, #5C33E1)",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                API
              </Typography>
            </Button>

            <Settings
              units={units}
              setUnits={setUnits}
              scale={scale}
              setScale={setScale}
            />

            <About />
          </Stack>
        </Box>
      ) : (
        <Box
          sx={{
            mt: 2,
            position: "absolute",
            width: "100vw",
            display: "flex",
            justifyContent: "space-between",
            zIndex: theme.zIndex.navbar,
          }}
        >
          <Stack
            component="span"
            onClick={() =>
              window.open(
                "https://www.pagasa.dost.gov.ph/",
                "_blank",
                "noopener,noreferrer"
              )
            }
            direction="row"
            spacing={0}
            sx={{
              cursor: "pointer",
              ml: "1.25rem",
              mr: !isBelowLaptop ? "1.25rem" : 0,
              justifyContent: "flex-start",
              display: "flex",
              alignItems: "center",
              pointerEvents: "auto",
            }}
          >
            <PAGASALogo
              style={{
                height: !isBelowLaptop ? "40px" : "35px",
                marginRight: 10,
              }}
            />
            <img
              src={Logo}
              style={{
                height: 30,
                WebkitFilter: "drop-shadow(1px 1px 2px rgba(21, 21, 21, 0.2)",
                filter: "drop-shadow(1px 1px 2px rgba(21, 21, 21, 0.2)",
              }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              mx: "1.25rem",
              ml: isBelowLaptop ? "auto" : "0",
              justifyContent: "flex-end",
              alignItems: "center",
              pointerEvents: "auto",
            }}
          >
            <IconButton
              size="lg"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(7px)",
                borderRadius: "25px",
                boxShadow: "sm",
                "&:hover": {
                  backgroundColor: "neutral.700",
                  color: "common.white",
                },
              }}
              onClick={() => {
                setSearchLayout("fullscreen");
              }}
            >
              <FontAwesomeIcon
                icon={faSearch}
                style={{
                  fontSize: "1.25rem",
                }}
              />
            </IconButton>

            <Modal
              open={!!searchLayout}
              onClose={() => setSearchLayout(undefined)}
            >
              <ModalDialog layout={searchLayout} variant="solid">
                <DialogContent>
                  <Search
                    arcgisToken={arcgisToken}
                    setLocation={setLocation}
                    map={map}
                    setOpen={setOpen}
                    setIsLocationReady={setIsLocationReady}
                    location={location}
                    selectedPolygon={selectedPolygon}
                    searchLayout={searchLayout}
                    setSearchLayout={setSearchLayout}
                  />
                </DialogContent>
              </ModalDialog>
            </Modal>
            <Sidebar
              units={units}
              setUnits={setUnits}
              scale={scale}
              setScale={setScale}
            />
          </Stack>
        </Box>
      )}
    </>
  );
};

export default Navbar;
