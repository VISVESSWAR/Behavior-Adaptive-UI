// Experiment Mode Control: Utilities for switching between policies and exporting logs
// Access via: window.__experimentControl

import { getExperimentMode, setExperimentMode } from "./dqnAdapter.jsx";

export const setupExperimentControl = () => {
  if (typeof window === "undefined") return;

  window.__experimentControl = {
    // Get current experiment mode
    getMode: () => getExperimentMode(),
    
    // Set experiment mode
    setMode: (mode) => setExperimentMode(mode),

    // Export RL logs as CSV
    exportRLLogs: () => {
      if (!window.__metricsCollector) {
        console.warn("[ExperimentControl] Metrics collector not initialized");
        return null;
      }
      const csv = window.__metricsCollector.getRLLogsAsCSV();
      if (!csv) {
        console.warn("[ExperimentControl] No RL logs to export");
        return null;
      }
      console.log("[ExperimentControl] RL logs exported:");
      console.log(csv);
      return csv;
    },

    // Clear RL logs
    clearRLLogs: () => {
      if (!window.__metricsCollector) {
        console.warn("[ExperimentControl] Metrics collector not initialized");
        return;
      }
      window.__metricsCollector.clearRLLogs();
      console.log("[ExperimentControl] RL logs cleared");
    },

    // Download RL logs as CSV file
    downloadRLLogs: () => {
      const csv = window.__experimentControl.exportRLLogs();
      if (!csv) return;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `rl_logs_${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("[ExperimentControl] RL logs downloaded as CSV");
    },

    // Get experiment info
    getStatus: () => {
      return {
        mode: EXPERIMENT_MODE,
        logsCount: window.__rlLogs?.length || 0,
        sessionId: window.__metricsCollector?.sessionId || "unknown",
        pathType: window.__metricsCollector?.pathType || "unknown",
      };
    },

    // Instructions
    help: () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║         EXPERIMENT CONTROL - Available Commands           ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  window.__experimentControl.getMode()                     ║
║    → Get current experiment mode (model|random|guided)   ║
║                                                            ║
║  window.__experimentControl.getStatus()                   ║
║    → Get experiment status (mode, logs count, pathType)   ║
║                                                            ║
║  window.__experimentControl.exportRLLogs()               ║
║    → Export all RL logs as CSV string                     ║
║                                                            ║
║  window.__experimentControl.downloadRLLogs()             ║
║    → Download RL logs as CSV file                         ║
║                                                            ║
║  window.__experimentControl.clearRLLogs()                ║
║    → Clear all RL logs from memory                        ║
║                                                            ║
║  To switch experiment mode:                               ║
║    - Edit src/utils/dqnAdapter.jsx                       ║
║    - Change: EXPERIMENT_MODE = "model"|"random"|"guided"║
║    - Reload the app                                       ║
║                                                            ║
║  EXPECTED WORKFLOW:                                        ║
║  1. Control-F to find EXPERIMENT_MODE in dqnAdapter.jsx  ║
║  2. Set mode to "random", reload                         ║
║  3. Use app for 5-10 minutes                            ║
║  4. Run exportRLLogs() or downloadRLLogs()             ║
║  5. Save the CSV                                         ║
║  6. Repeat with "guided" mode                            ║
║  7. Repeat with "model" mode                             ║
║  8. Compare CSV files for analysis                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    },
  };

  console.log("[ExperimentControl] Initialized. Type help() for commands:");
  console.log("  window.__experimentControl.help()");
};
