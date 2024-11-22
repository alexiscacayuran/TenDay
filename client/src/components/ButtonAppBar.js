import React, { useState } from "react";

import Geosearch from "./Geosearch";

import { AppBar, Toolbar } from "@mui/material";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Sheet,
  Modal,
  ModalClose,
} from "@mui/joy";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

const ButtonAppBar = ({
  accessToken,
  map,
  layerGroup,
  location,
  setLocation,
  setOpenContainer,
  openContainer,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <AppBar
        position="fixed"
        className="glass"
        elevation={0}
        color="transparent"
      >
        <Toolbar className="app-bar">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="div"
            sx={{ mr: 4, flexGrow: 0, fontWeight: "lg" }}
          >
            PAGASA 10-Day Climate Forecast
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <React.Fragment>
              <Button
                startDecorator={<SearchIcon />}
                variant="soft"
                color="primary"
                onClick={() => {
                  setOpen(true);
                }}
              >
                Search...
              </Button>
              <Modal
                aria-labelledby="modal-title"
                aria-describedby="modal-desc"
                open={open}
                onClose={() => setOpen(false)}
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
                  <ModalClose
                    variant="plain"
                    sx={{ m: 1, top: "-2.375rem", right: "-2.375rem" }}
                  />
                  <Geosearch
                    accessToken={accessToken}
                    map={map}
                    layerGroup={layerGroup}
                    location={location}
                    setLocation={setLocation}
                    setOpenModal={setOpen}
                    setOpenContainer={setOpenContainer}
                    openContainer={openContainer}
                  />
                </Sheet>
              </Modal>
            </React.Fragment>
          </Box>

          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default ButtonAppBar;
