import { useEffect, useState } from "react";
import { logEvent } from "../logging/eventLogger";

export default function useIdleTimer(flowId, stepId) {
  const [idleTime, setIdleTime] = useState(0);

  useEffect(() => {
    let lastActivity = performance.now();

    const reset = () => {
      lastActivity = performance.now();
    };

    const interval = setInterval(() => {
      const idle = (performance.now() - lastActivity) / 1000;
      setIdleTime(idle);

      if (idle >= 3) {
        logEvent({
          type: "idle",
          flowId,
          stepId,
          value: { idle_time: idle }
        });
      }
    }, 1000);

    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("click", reset);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("click", reset);
    };
  }, [flowId, stepId]);

  return idleTime;
}
