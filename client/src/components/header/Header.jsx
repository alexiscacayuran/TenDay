import React from "react";
import { Box, Sheet } from "@mui/joy";
import { useTheme } from "@mui/joy/styles";
import { useMediaQuery } from "@mui/material";
import Search from "./Search";
import Logo from "../../assets/logo/logo-rgb-light.png";

const Header = (props) => {
  const theme = useTheme();
  const isBelowLaptop = useMediaQuery((theme) => theme.breakpoints.down("lg"));

  return (
    <Box sx={{ pointerEvents: "auto", width: "600px", flexShrink: 1 }}>
      {!isBelowLaptop ? (
        <Sheet
          variant="solid"
          sx={{
            borderRadius: "lg",
            py: 1.5,
            paddingInline: "1.25rem",
            boxShadow: "sm",
            mx: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <img
            alt="10-day forecast logo"
            src={Logo}
            style={{ height: "30px" }}
          />
          <Search {...props} />
        </Sheet>
      ) : (
        <Box display="flex" alignItems="center" gap={1.5}>
          <img
            alt="10-day forecast logo"
            src={Logo}
            style={{ height: "35px" }}
          />
          <Search {...props} />
        </Box>
      )}
    </Box>
  );
};

export default Header;
