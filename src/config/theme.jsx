import { createMuiTheme } from "@material-ui/core/styles";
import paletteRed from "@material-ui/core/colors/red";

import shColors from "./colors";

export default createMuiTheme({
  title: "Stöck Høund",

  palette: {
    primary: {
      main: shColors.swedishBlue,
    },
    secondary: paletteRed,
  },

  typography: {
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;",
  },

  shape: {
    borderRadius: 2,
  },

  layout: {
    breakpoints: {
      xs: 12,
      sm: 8,
      md: 6,
      lg: 4,
      xl: 4,
    },
  },
});

export const appTheme = {
  global: {
    colors: {
      brand: shColors.swedishBlue,
      "accent-1": "#1686E0",
      focus: "accent-1",
    },
    font: {
      family: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;",
    },
  },
};
