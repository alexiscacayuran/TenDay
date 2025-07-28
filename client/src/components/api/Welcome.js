import React from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Typewriter } from "react-simple-typewriter";
import logo from "../../assets/logo/logo-rgb-grad.png";
import easitool from "../../assets/img/easitool2.png";
import apiDoc from "../../assets/img/api-doc.pdf";

export default function WelcomeSection() {
  const theme = useTheme();
  const textColor = "#617487";

  const iconStyles = {
    width: 50,
    height: 50,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(45deg, #09bdec, #3f79ff)",
    color: "#fff",
    transition: "background-position 0.5s ease",
    backgroundSize: "200% 200%",
    backgroundPosition: "0% 50%",
    "&:hover": {
      backgroundPosition: "100% 50%",
      "& svg": {
        animation: "shakeIcon 0.4s ease",
      },
    },
    "& svg": {
      fontSize: 28,
    },
    "@keyframes shakeIcon": {
      "0%": { transform: "translateX(0)" },
      "25%": { transform: "translateX(-2px)" },
      "50%": { transform: "translateX(2px)" },
      "75%": { transform: "translateX(-2px)" },
      "100%": { transform: "translateX(0)" },
    },
  };

  return (
    <Grid
      container
      spacing={0}
      sx={{
        width: "100%",
        height: { md: "100vh", xs: "auto" },
        margin: 0,
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Box 1: Welcome */}
      <Grid item xs={12} sm={12} md={6}>
        <Box
          sx={{
            height: { md: "100%", xs: "auto" },
            minHeight: { xs: "100vh", sm: "100vh" },
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "center", sm: "center", md: "flex-start" },
            justifyContent: { xs: "center", sm: "center", md: "center" },
            textAlign: { xs: "center", sm: "center", md: "left" },
            px: 6,
            py: 6,
          }}
        >
          <Typography
            variant="h5"
            fontWeight="regular"
            gutterBottom
            sx={{
              letterSpacing: 1,
              color: textColor,
              fontSize: { xs: "1.3rem", sm: "2rem", md: "2.2rem" },
            }}
          >
            Welcome to
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: { xs: "center", md: "flex-start" },
              gap: 1,
              textAlign: { xs: "center", md: "left" },
              mb: 2,
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                height: { xs: 40, sm: 70, md: 70 },
                mb: { xs: 1, md: 0 },
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "column", md: "row" },
              alignItems: { xs: "center", md: "center" },
              justifyContent: { xs: "center", md: "flex-start" },
              textAlign: { xs: "center", md: "left" },
              minHeight: "60px",
              mb: 2,
              gap: { xs: 0.5, md: 1 },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: textColor,
                fontFamily: "Commissioner",
                fontWeight: 500,
                fontSize: { xs: "1rem", sm: "1.2rem", md: "1.5rem" },
              }}
            >
              An API for
            </Typography>

            <Box
              sx={{
                minWidth: "220px",
                fontWeight: "bold",
                fontSize: "1.5rem",
                background: "linear-gradient(90deg, #09bdec, #3f79ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <Typewriter
                words={[
                  "Ten Day Forecast.",
                  "Seasonal Forecast.",
                  "Projections.",
                  "Climate Files.",
                ]}
                loop={0}
                cursor
                cursorStyle="_"
                typeSpeed={100}
                deleteSpeed={50}
                delaySpeed={1000}
              />
            </Box>
          </Box>

          <Box
            sx={{
              my: 3,
              height: "4px",
              width: "100px",
              background: "linear-gradient(90deg, #09bdec, #3f79ff)",
              borderRadius: "4px",
            }}
          />

          <Typography
            variant="body1"
            sx={{
              mt: 2,
              mb: 1,
              color: textColor,
              fontFamily: "Commissioner",
            }}
          >
            Designed for <strong>developers,</strong> trusted by{" "}
            <strong>forecasters</strong> — learn how to connect with our APIs
            and turn raw climate data into real-world impact.
          </Typography>

          <Box mt={4}>
            <Button
              component="a"
              href={apiDoc}
              download
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: "bold",
                borderRadius: "0",
                position: "relative",
                zIndex: 1,
                overflow: "hidden",
                backgroundColor: "transparent",
                border: "2px solid",
                borderImage: "linear-gradient(90deg, #09bdec, #3f79ff) 1",
                color: "transparent",
                backgroundImage: "linear-gradient(90deg, #09bdec, #3f79ff)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                transition: "all 0.5s ease",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: "100%",
                  backgroundImage:
                    "linear-gradient(270deg, #09bdec, #3f79ff, #09bdec)",
                  backgroundSize: "400% 400%",
                  zIndex: -1,
                  transition: "all 0.5s ease",
                  transform: "scaleX(0)",
                  transformOrigin: "left",
                  opacity: 1,
                },
                "&:hover::before": {
                  transform: "scaleX(1)",
                  opacity: 1,
                  animation: "gradientMove 3s linear infinite",
                },
                "&:hover": {
                  WebkitTextFillColor: "#fff",
                  color: "#fff",
                  // Removed this line ↓ to keep the border
                  // border: "2px solid transparent",
                },
                "@keyframes gradientMove": {
                  "0%": { backgroundPosition: "0% 50%" },
                  "50%": { backgroundPosition: "100% 50%" },
                  "100%": { backgroundPosition: "0% 50%" },
                },
              }}
            >
              Download API Guide
            </Button>
          </Box>

          {/* Contact Section */}
          <Box sx={{ mt: 6 }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              sx={{ color: textColor, fontFamily: "Commissioner" }}
            >
              Contact Us
            </Typography>
            <Box display="flex" gap={3}>
              <Box
                component="a"
                href="mailto:sscisproject@gmail.com"
                sx={iconStyles}
              >
                <EmailIcon />
              </Box>
              <Box component="a" href="tel:+63282840800" sx={iconStyles}>
                <PhoneIphoneIcon />
              </Box>
              <Box
                component="a"
                href="https://maps.app.goo.gl/xT4Qk2XpoA3VZZDD7"
                target="_blank"
                rel="noopener noreferrer"
                sx={iconStyles}
              >
                <LocationOnIcon />
              </Box>
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Box 2: EasiTool Image */}
      <Grid
        item
        xs={12}
        sm={12}
        md={6}
        sx={{
          display: { xs: "none", sm: "none", md: "flex" },
          alignItems: "flex-end",
          justifyContent: "flex-end",
          pr: 4,
          pb: 0,
        }}
      >
        <Box
          component="img"
          src={easitool}
          alt="EasiTool"
          sx={{
            maxWidth: "100%",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </Grid>
    </Grid>
  );
}
