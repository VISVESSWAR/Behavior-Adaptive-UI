import { logEvent } from "./eventLogger.jsx";

export function startMetricSnapshot(flowId, getMetrics) {
  setInterval(() => {
    logEvent({
      type: "metric_snapshot",
      flowId,
      metrics: getMetrics()
    });
  }, 60000);
}
