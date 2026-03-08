import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMetricsCollector } from "../context/MetricsContext.jsx";

// Map routes to flowId/stepId for task tracking in ML training data
const ROUTE_TO_TASK_MAP = {
  "/": { flowId: "authentication", stepId: "login" },
  "/login": { flowId: "authentication", stepId: "login" },
  "/signup": { flowId: "authentication", stepId: "signup" },
  "/home": { flowId: "app", stepId: "home" },
  "/dashboard": { flowId: "dashboard", stepId: "main" },
  "/transaction": { flowId: "transaction", stepId: "execute" },
  "/metrics": { flowId: "metrics", stepId: "view" },
  "/recover": { flowId: "recovery", stepId: "initiate" },
  "/otp-recover": { flowId: "recovery", stepId: "otp" },
  "/otp-verify": { flowId: "recovery", stepId: "verify" },
  "/tap-wait": { flowId: "recovery", stepId: "tap_wait" },
  "/scan-qr": { flowId: "recovery", stepId: "qr_scan" },
  "/finish-recovery": { flowId: "recovery", stepId: "finish" },
  "/reset-password": { flowId: "recovery", stepId: "reset_password" },
};

export function useTaskTracking() {
  const location = useLocation();
  const { metricsCollectorRef } = useMetricsCollector();

  useEffect(() => {
    // only update when we have an active collector
    if (!metricsCollectorRef?.current) return;

    const task = ROUTE_TO_TASK_MAP[location.pathname] || {
      flowId: "unknown",
      stepId: location.pathname.replace(/\//g, "_"),
    };

    console.log(
      `[useTaskTracking] Route: ${location.pathname} → Task: ${task.flowId}/${task.stepId}`,
    );

    metricsCollectorRef.current.updateTaskIds(task.flowId, task.stepId);
  }, [location.pathname, metricsCollectorRef, metricsCollectorRef.current]);
}
