import React, { useState } from "react";
import { useTheme } from "@mui/joy/styles";
import { useMediaQuery } from "@mui/material";
import {
  Button,
  IconButton,
  Drawer,
  Sheet,
  DialogTitle,
  Typography,
  ModalClose,
  DialogContent,
  Divider,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  FormHelperText,
  Box,
  ListItemButton,
} from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import Dexie from "dexie";

// Use existing Dexie instance for OverlayCache
const db = new Dexie("WeatherLayerCache");
db.version(1).stores({
  scalars: "url, scalarData",
  vectors: "url, vectorData",
});

const Settings = ({
  units,
  setUnits,
  scale,
  setScale,
  openSidebar,
  setOpenSidebar,
}) => {
  const theme = useTheme();
  const isLaptop = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);

  const clearCache = async () => {
    await Promise.all([db.scalars.clear(), db.vectors.clear()]);
    window.location.reload();
  };

  const renderUnitSelector = (label, options, value, onChange) => (
    <FormControl orientation={isLaptop ? "horizontal" : "vertical"}>
      <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
        <FormLabel sx={{ typography: "title-sm" }}>{label}</FormLabel>
      </Box>
      <ToggleButtonGroup
        color="primary"
        size="sm"
        variant="outlined"
        value={value}
        onChange={onChange}
        sx={{ minWidth: 200 }}
      >
        {options.map(({ val, label }) => (
          <Button
            key={val}
            value={val}
            sx={{ flexShrink: 1, flexGrow: 1, maxWidth: 150 }}
          >
            {label}
          </Button>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  );

  const renderButton = () => {
    const size = isLaptop
      ? "laptop"
      : isTablet
      ? "tablet"
      : isMobile
      ? "mobile"
      : null;

    const buttons = {
      laptop: (
        <Button
          size="lg"
          color="inherit"
          sx={{ px: "0.75rem" }}
          onClick={() => setOpen(true)}
          startDecorator={
            <FontAwesomeIcon
              icon={faGear}
              style={{ fontSize: "1.25rem", color: "#32383E" }}
            />
          }
        >
          Settings
        </Button>
      ),
      tablet: (
        <IconButton
          size="lg"
          color="inherit"
          sx={{ px: "0.75rem" }}
          onClick={() => setOpen(true)}
        >
          <FontAwesomeIcon
            icon={faGear}
            style={{ fontSize: "1.25rem", color: "#32383E" }}
          />
        </IconButton>
      ),
      mobile: (
        <ListItemButton onClick={() => setOpen(true)}>Settings</ListItemButton>
      ),
    };

    return buttons[size] || null;
  };

  return (
    <>
      {renderButton()}
      <Drawer
        size={isTablet ? "md" : "sm"}
        anchor="right"
        open={open}
        onClose={() => {
          if (openSidebar) setOpenSidebar(false);
          setOpen(false);
        }}
        sx={{
          "--Drawer-transitionDuration": "0s",
          // "--Drawer-transitionFunction": "cubic-bezier(0.79,0.14,0.15,0.86)",
        }}
        slotProps={{
          content: {
            sx: {
              bgcolor: "transparent",
              p: { md: 1, xs: 0 },
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
            borderRadius: { md: "md", xs: 0 },
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            height: "100%",
            overflow: "auto",
          }}
        >
          <DialogTitle sx={{ fontSize: "1.4rem", fontWeight: 900 }}>
            Settings
          </DialogTitle>
          <ModalClose color="inherit" />

          <DialogContent sx={{ gap: 2 }}>
            <Typography level="title-md" sx={{ fontWeight: "bold", mt: 1 }}>
              Units and Measurements
            </Typography>

            {renderUnitSelector(
              "Temperature",
              [
                { val: "°C", label: "°C" },
                { val: "°F", label: "°F" },
              ],
              units.temperature,
              (e, val) => val && setUnits({ ...units, temperature: val })
            )}

            {renderUnitSelector(
              "Rainfall",
              [
                { val: "mm/day", label: "mm/day" },
                { val: "in/day", label: "in/day" },
              ],
              units.rainfall,
              (e, val) => val && setUnits({ ...units, rainfall: val })
            )}

            {renderUnitSelector(
              "Wind Speed",
              [
                { val: "m/s", label: "m/s" },
                { val: "km/h", label: "km/h" },
                { val: "kt", label: "knot" },
              ],
              units.windSpeed,
              (e, val) => val && setUnits({ ...units, windSpeed: val })
            )}

            {renderUnitSelector(
              "Wind Direction",
              [
                { val: "arrow", label: "arrow" },
                { val: "desc", label: "description" },
              ],
              units.windDirection,
              (e, val) => val && setUnits({ ...units, windDirection: val })
            )}

            {renderUnitSelector(
              "Map Scale",
              [
                { val: "metric", label: "km" },
                { val: "imperial", label: "mi" },
              ],
              scale.metric ? "metric" : "imperial",
              (e, val) => {
                if (val)
                  setScale({
                    metric: val === "metric",
                    imperial: val === "imperial",
                  });
              }
            )}

            <Typography level="title-md" sx={{ fontWeight: "bold", mt: 2 }}>
              Data Management
            </Typography>
            <FormControl orientation={isLaptop ? "horizontal" : "vertical"}>
              <Box sx={{ flex: 1, pr: 1 }}>
                <FormLabel sx={{ typography: "title-sm" }}>
                  Clear App Cache
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
    </>
  );
};

export default Settings;
