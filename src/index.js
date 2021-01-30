// vendor imports
import React from "react";
import ReactDOM from "react-dom";

// local imports
import App from "./components/App.jsx";

// asset imports
import "./sass/master.scss";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
