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
  Stack,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Link,
  ListItemButton,
} from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { GIZLogo, BMUVIKILogo } from "../utils/CustomIcons";
import Ana from "../../assets/images/ana-portrait.jpg";
import LogoDark from "../../assets/logo/logo-rgb-dark.png";

const About = ({ openSidebar, setOpenSidebar }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isLaptop = useMediaQuery(theme.breakpoints.up("lg"));
  const isTablet = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isBelowLaptop = useMediaQuery(theme.breakpoints.down("lg"));

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
              icon={faCircleInfo}
              style={{ fontSize: "1.25rem", color: "#32383E" }}
            />
          }
        >
          About
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
            icon={faCircleInfo}
            style={{ fontSize: "1.25rem", color: "#32383E" }}
          />
        </IconButton>
      ),
      mobile: (
        <ListItemButton onClick={() => setOpen(true)}>About</ListItemButton>
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
            borderRadius: "md",
            py: 2,
            pl: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            height: "100%",
            overflow: "auto",
          }}
        >
          <DialogTitle>About</DialogTitle>
          <ModalClose color="inherit" />

          <DialogContent sx={{ gap: 2, p: 1 }}>
            <Box sx={{ mt: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <img
                  src="https://pubfiles.pagasa.dost.gov.ph/pagasaweb/images/pagasa-logo.png"
                  alt="PAGASA Logo"
                  height={isTablet ? 35 : 25}
                />
                <img
                  src={LogoDark}
                  alt="TenDay Logo"
                  height={isTablet ? 35 : 25}
                />
              </Stack>
            </Box>

            <Box sx={{ mr: 1 }}>
              <Typography
                level={isTablet ? "body-md" : "body-sm"}
                sx={{ mt: 1, textAlign: "justify" }}
              >
                TenDay is a{" "}
                <Typography sx={{ fontWeight: "bold" }}>
                  10-day climate forecast visualization app
                </Typography>{" "}
                developed by DOST-PAGASA that provides advance notice of
                potential hazards related to weather, climate, and hydrological
                events for farmers and other socio-economic sectors.
              </Typography>

              <Typography
                level={isTablet ? "body-md" : "body-sm"}
                sx={{ mt: 2, textAlign: "justify" }}
              >
                This could serve as input/basis to formulate local climate
                advisories for farmers, fisherfolks, and disaster preparedness.
              </Typography>

              <Typography
                level={isTablet ? "body-md" : "body-sm"}
                sx={{ mt: 2, textAlign: "justify" }}
              >
                This app is updated every Monday, Wednesday, and Friday, UTC+8
                by the Climate Monitoring and Prediction Section (CLIMPS) under
                the Climatology and Agrometeorology Division (CAD).
              </Typography>
            </Box>

            <Box sx={{ mt: 1, mr: 1 }}>
              <Typography level={isTablet ? "title-lg" : "title-md"}>
                Data Sources
              </Typography>
              <Stack
                direction={isTablet ? "row" : "column"}
                spacing={isTablet ? 4 : 1}
                alignItems={isTablet ? "center" : "flex-start"}
                justifyContent="flex-start"
                mt={1}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/57/Noaa-logo-rgb-2022.svg"
                  alt="NOAA Logo"
                  height="50"
                />
                <Typography
                  level={isTablet ? "body-md" : "body-sm"}
                  sx={{ textAlign: "justify" }}
                >
                  This product is based on forecasts from the Global Forecast
                  System (GFS) by the National Centers for Environmental
                  Prediction (NCEP). More info
                  <Link
                    variant="plain"
                    href="https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs"
                    target="_blank"
                  >
                    here.
                  </Link>
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ mt: 1, mr: 1 }}>
              <Typography level={isTablet ? "title-lg" : "title-md"}>
                Contact
              </Typography>
              <Typography
                level={isTablet ? "body-md" : "body-sm"}
                sx={{ mt: 1 }}
              >
                For inquiries or feedback, contact:
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  justifyContent: "center",
                  flexShrink: 1,
                }}
              >
                <Card variant="outlined" sx={{ flexShrink: 1, width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isTablet ? "row" : "column",
                      alignItems: "center",
                    }}
                  >
                    <Avatar src={Ana} size={isTablet ? "lg" : "md"} />
                    <Stack
                      sx={{
                        ml: isTablet ? 2 : 0,
                        alignItems: isTablet ? "flex-start" : "center",
                      }}
                    >
                      <Typography level={isTablet ? "title-lg" : "title-md"}>
                        Ana Liza S. Solis
                      </Typography>
                      <Typography level={isTablet ? "body-sm" : "body-xs"}>
                        Chief, Climate Monitoring and Prediction Section
                      </Typography>
                    </Stack>
                  </Box>
                  <CardContent>
                    <Typography level={isTablet ? "body-sm" : "body-xs"}>
                      Climatology and Agrometeorology Division
                    </Typography>
                    <Typography level={isTablet ? "body-sm" : "body-xs"}>
                      DOST-PAGASA
                    </Typography>
                  </CardContent>
                  <CardActions
                    sx={{ flexFlow: "row wrap", alignItems: "flex-start" }}
                  >
                    <Chip
                      variant="outlined"
                      color="primary"
                      size="sm"
                      startDecorator={<FontAwesomeIcon icon={faEnvelope} />}
                      sx={{ fontSize: isMobile && "0.6rem" }}
                    >
                      asolis@pagasa.dost.gov.ph
                    </Chip>
                    <Chip
                      variant="outlined"
                      color="primary"
                      size="sm"
                      startDecorator={<FontAwesomeIcon icon={faPhone} />}
                      sx={{ fontSize: isMobile && "0.6rem" }}
                    >
                      (02) 8284-0800 loc. 4920/4921
                    </Chip>
                  </CardActions>
                </Card>
              </Box>
            </Box>

            <Box sx={{ px: 1, flexShrink: 1 }}>
              <Typography level="body-md" />
              <Stack
                direction={isTablet ? "row" : "column"}
                spacing={0}
                justifyContent="center"
                alignItems="center"
                sx={{ flexWrap: "wrap" }} // Helps when screen shrinks more than logo min width
              >
                <GIZLogo />
                <BMUVIKILogo />
              </Stack>
            </Box>
          </DialogContent>
        </Sheet>
      </Drawer>
    </>
  );
};

export default About;
