import { createTheme } from "@mui/material/styles";
import { extendTheme } from "@mui/joy/styles";
import { deepmerge } from "@mui/utils";
import "@fontsource/commissioner"; // Defaults to weight 400

const joyTheme = extendTheme({
  breakpoints: {
    values: {
      mobile: 0,
      tablet: 768,
      laptop: 1200,
      desktop: 1312,
    },
  },
  fontFamily: {
    display: '"Commissioner", sans-serif',
    body: '"Commissioner", sans-serif',
  },
});

const muiTheme = createTheme({});

const theme = deepmerge(joyTheme, muiTheme);

export default theme;
