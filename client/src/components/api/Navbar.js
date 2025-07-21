import React, { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Tabs,
  Tab,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import logo from "../../assets/logo/logo-rgb-dev.png";
import logo2 from "../../assets/logo/logo-rgb-grad.png";

export default function Navbar({ selectedTab, handleTabChange, scrolled, sections }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));  // xs, sm
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));   // md and up

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleDrawerItemClick = (index) => {
    handleTabChange(null, index);
    setDrawerOpen(false);
  };

  const useTransparent = scrolled; // only apply blur/transparent on scroll
  const currentLogo = useTransparent ? logo2 : logo;

  const gradientText = {
    background: "linear-gradient(90deg, #09bdec, #3f79ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{ background: "transparent", boxShadow: "none" }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
            background: useTransparent
              ? "rgba(255, 255, 255, 0.05)"
              : "linear-gradient(90deg, #09bdec, #3f79ff)",
            backdropFilter: useTransparent ? "blur(10px)" : "none",
            WebkitBackdropFilter: useTransparent ? "blur(10px)" : "none",
            transition: "all 0.4s ease",
          }}
        />

        <Toolbar>
          <img
            src={currentLogo}
            alt="Logo"
            style={{ height: "32px", marginRight: 8 }}
          />
          <Box sx={{ flexGrow: 1 }} />

          {isMobile ? (
            // Mobile: Hamburger
            <IconButton
              edge="end"
              onClick={handleDrawerToggle}
              sx={
                useTransparent
                  ? gradientText
                  : { color: "#fff" }
              }
            >
              <MenuIcon />
            </IconButton>
          ) : (
            // Desktop: Tabs
            <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                TabIndicatorProps={{
                    style: {
                    background: useTransparent
                        ? "linear-gradient(90deg, #09bdec, #3f79ff)"
                        : "#ffffff",
                    height: "3px",
                    },
                }}
                sx={{
                    ".MuiTab-root": {
                    fontFamily: "Commissioner",
                    textTransform: "none",
                    fontSize: "16px",
                    fontWeight: "bold",
                    ...(useTransparent
                        ? {
                            background: "linear-gradient(90deg, #09bdec, #3f79ff)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }
                        : {
                            color: "#fff",
                            WebkitTextFillColor: "#fff",
                        }),
                    },
                    ".Mui-selected": {
                    fontWeight: "bold",
                    ...(useTransparent
                        ? {
                            background: "linear-gradient(90deg, #09bdec, #3f79ff)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }
                        : {
                            color: "#fff",
                            WebkitTextFillColor: "#fff",
                        }),
                    },
                }}
                >
                {sections.map((label, i) => (
                    <Tab key={i} label={label} />
                ))}
                </Tabs>

          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="top"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            background: "linear-gradient(90deg, #09bdec, #3f79ff)",
            height: "100vh",
            color: "white",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {sections.map((label, index) => (
            <ListItem
              button
              key={index}
              onClick={() => handleDrawerItemClick(index)}
              sx={{ justifyContent: "center" }}
            >
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: 24,
                  fontWeight: "bold",
                  fontFamily: "Commissioner",
                  textAlign: "center",
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}
