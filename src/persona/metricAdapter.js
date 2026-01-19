export function adaptMetrics(raw) {
  if (!raw) return null;

  return {
    vel_mean: Math.min(raw.s_vel_mean / 3000, 1),
    idle: Math.min(raw.idle_time / 10, 1),
    hesitation: Math.min(raw.s_mean_time_per_action / 2, 1),
    misclicks: Math.min((raw.s_num_misclicks || 0) / 10, 1)
  };
}
