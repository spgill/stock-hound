// Module imports
import ReactDOM from 'react-dom';
import { MuiThemeProvider } from '@material-ui/core/styles';

// Local script imports
import App from './javascript/components/App.jsx';
import theme from './javascript/config/theme';

// Style imports
import './sass/master.scss';

// Render the App into the DOM
ReactDOM.render(
    <MuiThemeProvider theme={theme}>
        <App />
    </MuiThemeProvider>,
    document.getElementById('sh-App'),
);
