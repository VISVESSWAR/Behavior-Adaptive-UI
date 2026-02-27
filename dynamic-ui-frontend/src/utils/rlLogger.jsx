// RL Logger: Async logging for experiment tracking (browser-safe)
// Logs: timestamp, persona, pathType, modelAction, finalAction, source, reward, taskTime, success

const LOG_HEADER =
  "timestamp,persona,pathType,modelAction,finalAction,source,reward,taskTime,success\n";

// Append RL log entry (non-blocking, async)
export const appendRLLog = async (entry) => {
  if (typeof window !== "undefined") {
    try {
      const row = [
        entry.timestamp || new Date().toISOString(),
        entry.persona || "unknown",
        entry.pathType || "unknown",
        entry.modelAction ?? -1,
        entry.finalAction ?? -1,
        entry.source || "unknown",
        entry.reward ?? 0,
        entry.taskTime ?? 0,
        entry.success ? 1 : 0,
      ].join(",");

      if (!window.__rlLogs) {
        window.__rlLogs = [];
      }

      window.__rlLogs.push(row);

      console.log("[RLLogger] Entry logged:", { ...entry, row });
    } catch (err) {
      console.error("[RLLogger] Failed to append log:", err.message);
    }
  }
};

// Export all logs as CSV string
export const exportRLLogs = () => {
  if (typeof window !== "undefined" && window.__rlLogs) {
    return LOG_HEADER + window.__rlLogs.join("\n");
  }
  return "";
};

// Clear logs
export const clearRLLogs = () => {
  if (typeof window !== "undefined") {
    window.__rlLogs = [];
    console.log("[RLLogger] Logs cleared");
  }
};