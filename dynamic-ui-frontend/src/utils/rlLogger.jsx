// RL Logger: Async logging for experiment tracking (browser-safe)
// Logs: timestamp, persona, pathType, modelAction, finalAction, source, reward, taskTime, success, user_id, task_id

const LOG_HEADER =
  "timestamp,persona,pathType,modelAction,finalAction,source,reward,taskTime,success,user_id,task_id\n";

// Append RL log entry (non-blocking, async)
export const appendRLLog = async (entry) => {
  if (typeof window !== "undefined") {
    try {
      // Auto-inject user_id and task_id
      const userId = entry.user_id || localStorage.getItem("user_id") || "user_unknown";
      const taskId = entry.task_id || localStorage.getItem("current_task_id") || "task_unknown";

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
        userId,
        taskId,
      ].join(",");

      if (!window.__rlLogs) {
        window.__rlLogs = [];
      }

      window.__rlLogs.push(row);

      console.log("[RLLogger] Entry logged:", { ...entry, userId, taskId, row });
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