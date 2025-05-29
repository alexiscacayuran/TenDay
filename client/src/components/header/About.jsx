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

const About = () => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isBelowLaptop = useMediaQuery(theme.breakpoints.down("lg"));

  const triggerButton = !isBelowLaptop ? (
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
  ) : (
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
  );

  return (
    <>
      {triggerButton}
      <Drawer
        size="md"
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
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
          <DialogTitle>
            <Typography
              startDecorator={
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  style={{ color: "#32383E" }}
                />
              }
            >
              About
            </Typography>
          </DialogTitle>
          <ModalClose color="inherit" />
          <Divider sx={{ mt: "auto", mr: 2 }} />
          <DialogContent sx={{ gap: 2, p: 1 }}>
            <Box sx={{ mt: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <img
                  src="https://pubfiles.pagasa.dost.gov.ph/pagasaweb/images/pagasa-logo.png"
                  alt="PAGASA Logo"
                  height="40"
                />
                <img src={LogoDark} alt="TenDay Logo" height="35" />
              </Stack>
            </Box>

            <Typography level="body-md" sx={{ mt: 1, textAlign: "justify" }}>
              TenDay is a{" "}
              <Typography sx={{ fontWeight: "bold" }}>
                10-day climate forecast visualization app
              </Typography>{" "}
              that provides advance notice of potential hazards related to
              weather, climate, and hydrological events for farmers and other
              socio-economic sectors.
            </Typography>

            <Typography level="body-md" sx={{ mt: 2, textAlign: "justify" }}>
              This could serve as input/basis to formulate local climate
              advisories for farmers, fisherfolks, and disaster preparedness.
            </Typography>

            <Typography level="body-md" sx={{ mt: 2, textAlign: "justify" }}>
              This app is updated every Monday, Wednesday, and Friday, PST by
              the Climate Monitoring and Prediction Section (CLIMPS) under the
              Climatology and Agrometeorology Division (CAD).
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Typography level="title-lg">Data Sources</Typography>
              <Stack direction="row" spacing={4} alignItems="flex-start" mt={1}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/57/Noaa-logo-rgb-2022.svg"
                  alt="NOAA Logo"
                  height="50"
                />
                <Typography level="body-md">
                  This product is based on forecasts from the Global Forecast
                  System (GFS) by the National Centers for Environmental
                  Prediction (NCEP). More info{" "}
                  <Link
                    variant="plain"
                    href="https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs"
                    target="_blank"
                  >
                    here
                  </Link>
                  .
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography level="title-lg">Contact</Typography>
              <Typography level="body-md" sx={{ mt: 1 }}>
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
                <Card variant="outlined" sx={{ flexShrink: 1 }}>
                  <Box display="flex" alignItems="center">
                    <Avatar src={Ana} size="lg" />
                    <Stack ml={2}>
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
                    sx={{ flexFlow: "row wrap", alignItems: "flex-start" }}
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
                    >
                      (02) 8284-0800 loc. 4920/4921
                    </Chip>
                  </CardActions>
                </Card>
              </Box>
            </Box>

            <Box sx={{ px: 1, mt: 4, flexShrink: 1 }}>
              <Typography level="body-md" />
              <Stack direction="row" spacing={0} justifyContent="center">
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
