import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ModalClose,
  IconButton,
  Typography,
} from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import Settings from "./Settings";
import About from "./About";

const Sidebar = ({ units, setUnits, scale, setScale }) => {
  const [openSidebar, setOpenSidebar] = useState(false);

  const toggleDrawer = (inOpen) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setOpenSidebar(inOpen);
  };

  return (
    <React.Fragment>
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
        onClick={toggleDrawer(true)}
      >
        <FontAwesomeIcon
          icon={faBars}
          style={{
            fontSize: "1.25rem",
          }}
        />
      </IconButton>

      <Drawer
        size="sm"
        anchor="right"
        open={openSidebar}
        onClose={toggleDrawer(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "none",
              backgroundColor: "transparent",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            ml: "auto",
            mt: 1,
            mr: 2,
            mb: 4,
          }}
        >
          <ModalClose color="initial" />
        </Box>
        <List
          size="lg"
          component="nav"
          sx={{
            flex: "none",
            fontSize: "xl",
            "& > div": { justifyContent: "flex-start" },
          }}
        >
          <ListItemButton>
            <Typography
              level="title-lg"
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
          </ListItemButton>
          <Settings
            units={units}
            setUnits={setUnits}
            scale={scale}
            setScale={setScale}
            openSidebar={openSidebar}
            setOpenSidebar={setOpenSidebar}
          />
          <About openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
        </List>
      </Drawer>
    </React.Fragment>
  );
};

export default Sidebar;
