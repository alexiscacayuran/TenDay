import React, { useState } from "react";

import Geosearch from "./Geosearch";

import { AppBar, Toolbar } from "@mui/material";
import { Box, Typography, Button, IconButton, Sheet, Modal } from "@mui/joy";
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
                  <Geosearch
                    accessToken={accessToken}
                    setLocation={setLocation}
                    map={map}
                    layerGroup={layerGroup}
                    location={location}
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
