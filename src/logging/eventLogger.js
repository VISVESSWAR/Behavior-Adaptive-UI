// src/logging/eventLogger.js

let rawLogs = [];
let lastLogTime = 0;

// 30 Hz sampling
const LOG_INTERVAL = 33;

export function logEvent(event) {
  const now = performance.now();

  if (now - lastLogTime < LOG_INTERVAL) return;

  lastLogTime = now;
  rawLogs.push(event);
}

export function getRawLogs() {
  return rawLogs;
}

export function clearLogs() {
  rawLogs = [];
}
