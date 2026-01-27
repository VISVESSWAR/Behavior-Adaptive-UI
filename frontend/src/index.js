import React from "react";
import ReactDOM from "react-dom/client";
import { UIProvider } from "./adaptation/UIContext";
import { TaskProvider } from "./task/TaskContext";
import { MetricsProvider } from "./context/MetricsContext";
import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <TaskProvider>
    <UIProvider>
      <MetricsProvider>
        <App />
      </MetricsProvider>
    </UIProvider>
  </TaskProvider>,
);
