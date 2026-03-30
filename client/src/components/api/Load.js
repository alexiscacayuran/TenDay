import React from "react";
import { Box, Typography, keyframes } from "@mui/material";
import logo from "../../assets/logo/logomark-white.png"; 

// Shake animation for the logo
const shake = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(5deg); }
  50% { transform: rotate(-5deg); }
  75% { transform: rotate(3deg); }
  100% { transform: rotate(0deg); }
`;

// Bounce animation for the letters
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

export default function Load() {
  return (
    <Box
      sx={{
        position: "fixed",
        zIndex: 2000,
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(90deg, #09bdec, #3f79ff)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
      }}
    >
      <Box
        component="img"
        src={logo}
        alt="Logo"
        sx={{
          width: 80,
          height: 80,
          mb: 2,
          animation: `${shake} 1s infinite`,
        }}
      />
      <Box sx={{ display: "flex", fontSize: "24px", fontWeight: "bold", gap: "4px" }}>
        {"Loading".split("").map((char, i) => (
          <Typography
            key={i}
            component="span"
            sx={{
              animation: `${bounce} 1.2s infinite ease-in-out`,
              animationDelay: `${i * 0.1}s`,
              display: "inline-block",
            }}
          >
            {char}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
