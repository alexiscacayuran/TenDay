import React, { useState } from "react";

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
} from "@mui/joy";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import Logo from "../assets/logo-text.png";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faGear } from "@fortawesome/free-solid-svg-icons";

const Navbar = ({
  accessToken,
  map,
  markerLayer,
  location,
  setLocation,
  setOpenContainer,
  openContainer,
}) => {
  const [openSearch, setOpenSearch] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
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
            <React.Fragment>
              <ButtonGroup>
                <Button
                  startDecorator={<SearchIcon />}
                  variant="solid"
                  color="neutral"
                  onClick={() => {
                    setOpenSearch(true);
                  }}
                >
                  Search...
                </Button>
                <Tooltip
                  placement="bottom"
                  title="See current location"
                  variant="plain"
                >
                  <Button color="neutral" variant="solid" sx={{ width: 35 }}>
                    <MyLocationIcon />
                  </Button>
                </Tooltip>
              </ButtonGroup>

              <Modal
                aria-labelledby="modal-title"
                aria-describedby="modal-desc"
                open={openSearch}
                onClose={() => setOpenSearch(false)}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Sheet
                  variant="outlined"
                  sx={{
                    minWidth: 500,
                    minHeight: 600,
                    maxWidth: 500,
                    borderRadius: "md",
                    p: 3,
                    boxShadow: "lg",
                  }}
                >
                  <Geosearch
                    accessToken={accessToken}
                    setLocation={setLocation}
                    map={map}
                    markerLayer={markerLayer}
                    location={location}
                    setOpenModal={setOpenSearch}
                    setOpenContainer={setOpenContainer}
                    openContainer={openContainer}
                  />
                </Sheet>
              </Modal>
            </React.Fragment>
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
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
