// vendor imports
import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider } from '@material-ui/core/styles';

// local imports
import App from './components/App.jsx';
import theme from './config/theme';

// asset imports
import './sass/master.scss';

ReactDOM.render(
  <React.StrictMode>
    <MuiThemeProvider theme={theme}>
        <App />
    </MuiThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
