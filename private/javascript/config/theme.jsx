import { createMuiTheme } from '@material-ui/core/styles';
import paletteRed from '@material-ui/core/colors/red';

import shColors from './colors';


export default createMuiTheme({
    palette: {
        primary: {
            main: shColors.swedishBlue
        },
        secondary: paletteRed
    },

    typography: {
        fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;"
    },

    shape: {
        borderRadius: 2
    }
});
