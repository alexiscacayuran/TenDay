import { createTheme } from "@mui/material/styles";
import { extendTheme } from "@mui/joy/styles";
import { deepmerge } from "@mui/utils";
import "@fontsource/commissioner"; // Defaults to weight 400

export const joyTheme = extendTheme({
  breakpoints: {
    values: {
      xs: 0,
      md: 768,
      lg: 1200,
      xl: 1312,
    },
  },
  fontFamily: {
    display: '"Commissioner", sans-serif',
    body: '"Commissioner", sans-serif',
  },
});

export const muiTheme = createTheme({
  palette: {
    mode: "light", // or 'dark'
  },
});

const theme = deepmerge(joyTheme, muiTheme);

export default theme;
