import React from "react";
import "leaflet/dist/leaflet.css";
import Map from "./components/Map";
import { joyTheme, muiTheme } from "./theme";
import {
  ThemeProvider,
  THEME_ID as MATERIAL_THEME_ID,
} from "@mui/material/styles";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/material/CssBaseline";

function App() {
  return (
    <CssVarsProvider theme={joyTheme}>
      <ThemeProvider theme={{ [MATERIAL_THEME_ID]: muiTheme }}>
        <CssBaseline enableColorScheme />
        <Map />
      </ThemeProvider>
    </CssVarsProvider>
  );
}

export default App;
