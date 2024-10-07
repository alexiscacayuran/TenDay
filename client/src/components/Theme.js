import { createTheme } from "@mui/material";
import "../styles.css";

const Theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "rgb(24, 116, 152)",
    },
    secondary: {
      main: "rgb(107, 165, 188)",
    },
    error: {
      main: "rgb(235, 83, 83)",
    },
    success: {
      main: "rgb(54, 174, 124)",
    },
    info: {
      main: "rgb(24, 116, 152)",
    },
    warning: {
      main: "#F9D923",
    },
  },
  typography: {
    fontFamily: ["Inter Variable"],
  },
});

export default Theme;
