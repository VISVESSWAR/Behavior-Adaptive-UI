import { useEffect, useState } from "react";
import { useTask } from "./TaskContext";

/**
 * Custom hook that tracks task elapsed time and timeout status
 * Returns elapsedTime (in ms) and timeout (boolean)
 * If elapsedTime exceeds timeLimit and task is not completed, marks as failed
 */
export function useTaskTimer() {
  const task = useTask();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeout, setTimeout] = useState(false);

  useEffect(() => {
    // Only run if task is active
    if (!task.taskStartTime || !task.timeLimit) {
      return;
    }

    // Update elapsed time every 100ms
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - task.taskStartTime;
      setElapsedTime(elapsed);

      // Check if timeout
      if (elapsed > task.timeLimit && !task.completed && !task.failed) {
        setTimeout(true);
        task.markFailed();
        console.log(
          `[useTaskTimer] Task timeout: ${elapsed}ms > ${task.timeLimit}ms`,
        );
      }
    }, 100);

    return () => clearInterval(timer);
  }, [task.taskStartTime, task.timeLimit, task.completed, task.failed]);

  return {
    elapsedTime,
    timeout,
  };
}

export default useTaskTimer;
