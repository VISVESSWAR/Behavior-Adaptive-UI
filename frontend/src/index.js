import React from "react";
import ReactDOM from "react-dom/client";
import { UIProvider } from "./adaptation/UIContext";
import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UIProvider>
    <App />
  </UIProvider>
);
