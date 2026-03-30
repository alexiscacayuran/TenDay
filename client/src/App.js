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
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components
import API from "./components/api/API";

function App() {
  return (
    <CssVarsProvider theme={joyTheme}>
      <ThemeProvider theme={{ [MATERIAL_THEME_ID]: muiTheme }}>
        <CssBaseline enableColorScheme />

        <Router>
          <Routes>
            <Route path="/" element={<Map />} />
            {/*<Route path="/docs" element={<API />} /> */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>

      </ThemeProvider>
    </CssVarsProvider>
  );
}

export default App;
