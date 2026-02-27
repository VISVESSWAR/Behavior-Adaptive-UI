const KEY = "behavior_logs";

export function logEvent(e) {
  const logs = JSON.parse(localStorage.getItem(KEY) || "[]");

  logs.push({
    ts: Date.now(),
    ...e,
  });

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
