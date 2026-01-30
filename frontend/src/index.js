import React from "react";
import ReactDOM from "react-dom/client";
import { UIProvider } from "./adaptation/UIContext";
import { TaskProvider } from "./task/TaskContext";
import { MetricsProvider } from "./context/MetricsContext";
import App from "./App";
import "./styles.css";

// Global diagnostic helper for collection debugging
window.diagnoseCollection = async function() {
  console.log("\n" + "=".repeat(80));
  console.log("COLLECTION DIAGNOSTIC");
  console.log("=".repeat(80));
  
  if (!window.__metricsCollector) {
    console.error("✗ Collector not found on window.__metricsCollector");
    return;
  }
  
  const c = window.__metricsCollector;
  console.log("\n[COLLECTOR STATE]");
  console.log(`  DB Ready: ${c.dbReady ? "✓ YES" : "✗ NO"}`);
  console.log(`  Snapshots: ${c.snapshots.length}`);
  console.log(`  Metrics set: ${c.windowMetrics ? "✓ YES" : "✗ NO"}`);
  console.log(`  Persona set: ${c.currentPersona ? "✓ YES" : "✗ NO"}`);
  console.log(`  Idle: ${c.isIdle ? "✓ IDLE" : "ACTIVE"}`);
  
  console.log("\n[LAST 3 SNAPSHOTS]");
  c.snapshots.slice(-3).forEach((s, i) => {
    const idx = c.snapshots.length - (3 - i);
    console.log(`  [${idx}] ${new Date(s.timestamp).toLocaleTimeString()} - action:${s.finalAction}, reward:${s.taskReward}`);
  });
  
  console.log("\n[DATABASE]");
  await c.dbManager.printDiagnostics();
};

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
