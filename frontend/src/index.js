import React from "react";
import ReactDOM from "react-dom/client";
import { UIProvider } from "./adaptation/UIContext";
import { TaskProvider } from "./task/TaskContext";
import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <TaskProvider>
    <UIProvider>
      <App />
    </UIProvider>
  </TaskProvider>,
);
