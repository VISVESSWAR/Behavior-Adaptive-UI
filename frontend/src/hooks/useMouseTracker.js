import { useEffect, useRef, useState } from "react";
import { euclideanDistance, curvature } from "../utils/metrics";
import { logEvent } from "../logging/eventLogger";
import useIdleTimer from "./useIdleTimer";
import useScrollDepth from "./useScrollDepth";

export default function useMouseTracker(flowId, stepId) {
  const startTime = useRef(performance.now());
  const prev = useRef(null);
  const prevPrev = useRef(null);

  // Get idle time and scroll depth from other hooks
  const idleTime = useIdleTimer(flowId, stepId);
  const scrollDepth = useScrollDepth(flowId, stepId);

  const accum = useRef({
    totalDistance: 0,
    numActions: 0,
    velocities: [],
    accelerations: [],
    jerks: [],
    curvatures: [],
    actionTimes: [],
  });

  const [metrics, setMetrics] = useState({
    s_session_duration: 0,
    s_total_distance: 0,
    s_num_actions: 0,
    s_num_clicks: 0,
    s_num_misclicks: 0,
    s_mean_time_per_action: 0,
    s_vel_mean: 0,
    s_vel_std: 0,
    s_accel_mean: 0,
    s_accel_std: 0,
    s_curve_mean: 0,
    s_curve_std: 0,
    s_jerk_mean: 0,
  });

  function stats(arr) {
    if (!arr.length) return { mean: 0, std: 0 };
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = Math.sqrt(
      arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length
    );
    return { mean, std };
  }

  useEffect(() => {
    function handleMove(e) {
      const now = performance.now();
      const current = { x: e.clientX, y: e.clientY, t: now };

      let vel = 0,
        accel = 0,
        jerk = 0;

      if (prev.current) {
        const dt = (now - prev.current.t) / 1000;
        if (dt > 0) {
          const dist = euclideanDistance(prev.current, current);
          vel = dist / dt;

          accel = accum.current.velocities.length
            ? (vel - accum.current.velocities.at(-1)) / dt
            : 0;

          jerk = accum.current.accelerations.length
            ? (accel - accum.current.accelerations.at(-1)) / dt
            : 0;

          accum.current.totalDistance += dist;
          accum.current.velocities.push(vel);
          accum.current.accelerations.push(accel);
          accum.current.jerks.push(jerk);
          accum.current.actionTimes.push(dt);
          accum.current.numActions += 1;

          if (prevPrev.current) {
            accum.current.curvatures.push(
              curvature(prevPrev.current, prev.current, current)
            );
          }
        }
      }

      // LOG: derived movement signal only
      logEvent({
        type: "mouse_move",
        flowId,
        stepId,
        value: { vel, accel, jerk },
      });

      prevPrev.current = prev.current;
      prev.current = current;

      const velStats = stats(accum.current.velocities);
      const accStats = stats(accum.current.accelerations);
      const curStats = stats(accum.current.curvatures);

      setMetrics((m) => ({
        ...m,
        s_session_duration: (now - startTime.current) / 1000,
        s_total_distance: accum.current.totalDistance,
        s_num_actions: accum.current.numActions,
        s_mean_time_per_action:
          accum.current.actionTimes.reduce((a, b) => a + b, 0) /
          (accum.current.actionTimes.length || 1),
        s_vel_mean: velStats.mean,
        s_vel_std: velStats.std,
        s_accel_mean: accStats.mean,
        s_accel_std: accStats.std,
        s_curve_mean: curStats.mean,
        s_curve_std: curStats.std,
        s_jerk_mean:
          accum.current.jerks.reduce((a, b) => a + b, 0) /
          (accum.current.jerks.length || 1),
      }));
    }

    function handleClick(e) {
      const isMisclick = !e.target.closest(
        "button, a, input, select, textarea"
      );

      logEvent({
        type: "click",
        flowId,
        stepId,
        value: { isMisclick },
      });

      setMetrics((m) => ({
        ...m,
        s_num_clicks: m.s_num_clicks + 1,
        s_num_misclicks: m.s_num_misclicks + (isMisclick ? 1 : 0),
      }));
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("click", handleClick);
    };
  }, [flowId, stepId, idleTime, scrollDepth]);

  // Merge idle time and scroll depth into metrics
  const mergedMetrics = {
    ...metrics,
    s_idle_time: idleTime,
    s_scroll_depth: scrollDepth,
  };

  return mergedMetrics;
}
