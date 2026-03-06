import { useEffect, useRef, useState } from "react";
import { euclideanDistance, curvature } from "../utils/metrics.jsx";
import { logEvent } from "../logging/eventLogger.jsx";
import useIdleTimer from "./useIdleTimer.jsx";
import useScrollDepth from "./useScrollDepth.jsx";

// Sliding window size: 10 seconds
const WINDOW_MS = 10000;

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
    // Extract values from timestamped samples
    const values = arr.map(x => x.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
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

          // Get the last velocity value for acceleration calculation
          const lastVel = accum.current.velocities.length
            ? accum.current.velocities.at(-1).value
            : 0;
          accel = (vel - lastVel) / dt;

          // Get the last acceleration value for jerk calculation
          const lastAccel = accum.current.accelerations.length
            ? accum.current.accelerations.at(-1).value
            : 0;
          jerk = (accel - lastAccel) / dt;

          accum.current.totalDistance += dist;
          
          // Store samples with timestamps instead of raw values
          accum.current.velocities.push({ value: vel, t: now });
          accum.current.accelerations.push({ value: accel, t: now });
          accum.current.jerks.push({ value: jerk, t: now });
          accum.current.actionTimes.push({ value: dt, t: now });
          accum.current.numActions += 1;

          if (prevPrev.current) {
            accum.current.curvatures.push({
              value: curvature(prevPrev.current, prev.current, current),
              t: now,
            });
          }

          // Remove samples older than WINDOW_MS from all arrays
          accum.current.velocities = accum.current.velocities.filter(
            (x) => now - x.t <= WINDOW_MS
          );
          accum.current.accelerations = accum.current.accelerations.filter(
            (x) => now - x.t <= WINDOW_MS
          );
          accum.current.jerks = accum.current.jerks.filter(
            (x) => now - x.t <= WINDOW_MS
          );
          accum.current.curvatures = accum.current.curvatures.filter(
            (x) => now - x.t <= WINDOW_MS
          );
          accum.current.actionTimes = accum.current.actionTimes.filter(
            (x) => now - x.t <= WINDOW_MS
          );
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
      const jerkValues = accum.current.jerks.map((x) => x.value);
      const actionTimeValues = accum.current.actionTimes.map((x) => x.value);

      setMetrics((m) => ({
        ...m,
        s_session_duration: (now - startTime.current) / 1000,
        s_total_distance: accum.current.totalDistance,
        s_num_actions: accum.current.numActions,
        s_mean_time_per_action:
          actionTimeValues.reduce((a, b) => a + b, 0) /
          (actionTimeValues.length || 1),
        s_vel_mean: velStats.mean,
        s_vel_std: velStats.std,
        s_accel_mean: accStats.mean,
        s_accel_std: accStats.std,
        s_curve_mean: curStats.mean,
        s_curve_std: curStats.std,
        s_jerk_mean:
          jerkValues.reduce((a, b) => a + b, 0) / (jerkValues.length || 1),
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
