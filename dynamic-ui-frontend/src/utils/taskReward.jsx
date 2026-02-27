// Task reward: +0.6 (complete), -0.4 (timeout), -0.01×pathLength; clipped to [-1, 1]

// Compute task reward based on completion, time, and path metrics
export function computeTaskReward(task) {
  if (!task) return 0;

  let r = 0.0;

  // Reward for task completion
  if (task.completed) {
    r += 0.6;
  }

  // Penalty for exceeding time limit
  if (task.elapsedTime && task.timeLimit && task.elapsedTime > task.timeLimit) {
    r -= 0.4;
  }

  // Penalty for long path (inefficient navigation)
  if (task.pathLength && typeof task.pathLength === "number") {
    r -= 0.02 * task.pathLength;
  }

  // Clip to [-1.0, 1.0] range
  return Math.max(-1.0, Math.min(1.0, r));
}

export default computeTaskReward;
