/**
 * Reward Function for DQN Training - matches training logic exactly
 *
 * Computes reward from state transition and action (s_t, a_t, s_{t+1})
 * Uses same persona factors and thresholds as DQN model training
 */

const P = {
  persona_factor: {
    novice_old: 1.6,
    intermediate: 1.0,
    expert: 0.6,
  },
};

// Thresholds (must match training)
const mt_thr = 1.0; // mean_time_per_action threshold
const nc_thr = 1.0; // num_clicks threshold
const sd_thr = 1.0; // session_duration threshold

export function computeReward(s_t, a_t, s_t1) {
  if (!s_t || !s_t1 || typeof a_t === "undefined") return 0;

  // Work with s_t1 state (next state)
  const s = JSON.parse(JSON.stringify(s_t1));
  const persona = s.persona || "intermediate";
  const pf = P.persona_factor[persona] || 1.0;

  // Base metrics from next state
  const sd0 = s.session_duration || 1.0;
  const mt0 = s.mean_time_per_action || 1.0;
  const nc0 = s.num_clicks || 1.0;

  // Thresholds
  const slow_user = mt0 > mt_thr;
  const error_prone = nc0 > nc_thr;
  const idle_user = sd0 > sd_thr;

  let r = 0.0;

  // Action-specific rewards (must match training)
  if (a_t === 0) {
    if (!slow_user && !error_prone) {
      r += 0.05;
    } else {
      r -= 0.1 * pf;
    }
  } else if (a_t === 1) {
    if (error_prone) {
      r += 0.35 * pf;
    } else {
      r -= 0.15 * pf;
    }
  } else if (a_t === 3) {
    if (slow_user) {
      r += 0.4 * pf;
    } else {
      r -= 0.2 * pf;
    }
  } else if (a_t === 7) {
    if (idle_user || slow_user) {
      r += 0.3 * pf;
    } else {
      r -= 0.15 * pf;
    }
  } else if (a_t === 9) {
    if (error_prone || idle_user) {
      r += 0.3 * pf;
    } else {
      r -= 0.1 * pf;
    }
  } else if ([2, 4, 6, 8].includes(a_t)) {
    r -= 0.25 * pf;
  }

  // Persona-specific penalties (must match training)
  if (persona === "expert" && [1, 3, 7, 9].includes(a_t)) {
    r -= 0.25;
  }
  if (persona === "novice_old" && a_t === 0) {
    r -= 0.15;
  }

  // Clip to [-1.0, 1.0] range (matches training)
  return Math.max(-1.0, Math.min(1.0, r));
}

export default computeReward;
