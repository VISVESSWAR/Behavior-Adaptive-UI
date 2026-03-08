const KEY = "behavior_logs";

export function logEvent(e) {
  const logs = JSON.parse(localStorage.getItem(KEY) || "[]");

  // Auto-inject user_id and task_id if not already present
  const enrichedEvent = {
    user_id: e.user_id || localStorage.getItem("user_id") || "user_unknown",
    task_id: e.task_id || localStorage.getItem("current_task_id") || "task_unknown",
    ts: Date.now(),
    ...e,
  };

  logs.push(enrichedEvent);

  localStorage.setItem(KEY, JSON.stringify(logs));
}

export function getLogs() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function getRawLogs() {
  return getLogs();
}

export function clearLogs() {
  localStorage.removeItem(KEY);
}
