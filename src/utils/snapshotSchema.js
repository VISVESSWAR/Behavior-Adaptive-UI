/**
 * DQN Snapshot Schema & CSV Builder
 *
 * Correct approach:
 * 1. Frontend collects ONE snapshot every 10s (metrics + persona + action)
 * 2. Store snapshots chronologically in IndexedDB
 * 3. Build CSV by pairing consecutive snapshots
 * 4. Compute rewards from (s_t, a_t, s_{t+1})
 */

/**
 * SNAPSHOT SCHEMA (what gets collected in frontend)
 *
 * One snapshot per 10-second window
 * Contains: current metrics + applied action
 * NO "next_" fields (those come from the next snapshot)
 */
export const SNAPSHOT_SCHEMA = {
  // Metadata
  timestamp: "number (ms)",
  sessionId: "string",
  flowId: "string (e.g., 'transaction')",
  stepId: "string (e.g., 'confirm_payment')",

  // Metrics snapshot (ONE measurement in time)
  metrics: {
    session_duration: "number (seconds elapsed)",
    total_distance: "number (pixels)",
    num_actions: "number (count)",
    num_clicks: "number (count)",
    mean_time_per_action: "number (seconds)",
    vel_mean: "number (normalized 0-1)",
    vel_std: "number",
    accel_mean: "number",
    accel_std: "number",
    curve_mean: "number",
    curve_std: "number",
    jerk_mean: "number",
  },

  // Persona at this point in time
  persona: {
    type: "string ('novice_old' | 'intermediate' | 'expert')",
    confidence: "number (0-1)",
    stable: "boolean",
  },

  // Action applied BEFORE this snapshot
  // (i.e., the action that caused the state change from t-1 to t)
  action: "number (0-9, or -1 if no action)",

  // UI state after action was applied
  uiState: {
    buttonSize: "number",
    textSize: "number",
    spacing: "number",
    tooltips: "boolean",
    // ... other UI params
  },

  // Terminal flag (end of episode)
  done: "boolean (true if flow completed/abandoned)",
};

/**
 * EXAMPLE SNAPSHOT (concrete values)
 */
export const EXAMPLE_SNAPSHOT = {
  timestamp: 1705779000000,
  sessionId: "session_1705779000000_abc123",
  flowId: "transaction",
  stepId: "confirm_payment",

  metrics: {
    session_duration: 20.5,
    total_distance: 8432.1,
    num_actions: 56,
    num_clicks: 8,
    mean_time_per_action: 0.42,
    vel_mean: 0.31,
    vel_std: 0.18,
    accel_mean: 0.22,
    accel_std: 0.19,
    curve_mean: 0.05,
    curve_std: 0.11,
    jerk_mean: 0.27,
  },

  persona: {
    type: "novice_old",
    confidence: 0.85,
    stable: true,
  },

  action: 3, // text_up was applied

  uiState: {
    buttonSize: 2,
    textSize: 5,
    spacing: 3,
    tooltips: true,
  },

  done: false,
};

/**
 * SNAPSHOT → STATE VECTOR transformation
 * Converts one snapshot to 15-column state vector
 */
export function snapshotToStateVector(snapshot) {
  if (!snapshot || !snapshot.metrics || !snapshot.persona) {
    console.warn("[snapshotToStateVector] Invalid snapshot");
    return null;
  }

  const m = snapshot.metrics;
  const p = snapshot.persona;

  // Persona one-hot encoding
  const personaOneHot = {
    s_persona_novice_old: p.type === "novice_old" ? 1.0 : 0.0,
    s_persona_intermediate: p.type === "intermediate" ? 1.0 : 0.0,
    s_persona_expert: p.type === "expert" ? 1.0 : 0.0,
  };

  // 15-column state vector
  return {
    s_session_duration: m.session_duration || 0,
    s_total_distance: m.total_distance || 0,
    s_num_actions: m.num_actions || 0,
    s_num_clicks: m.num_clicks || 0,
    s_mean_time_per_action: m.mean_time_per_action || 0,
    s_vel_mean: m.vel_mean || 0,
    s_vel_std: m.vel_std || 0,
    s_accel_mean: m.accel_mean || 0,
    s_accel_std: m.accel_std || 0,
    s_curve_mean: m.curve_mean || 0,
    s_curve_std: m.curve_std || 0,
    s_jerk_mean: m.jerk_mean || 0,
    ...personaOneHot,
  };
}

/**
 * TRANSITION BUILDER
 *
 * Takes array of snapshots and builds DQN transitions
 * by pairing consecutive snapshots
 */
export class TransitionBuilder {
  /**
   * Build transitions from chronological snapshots
   *
   * @param {Array} snapshots - sorted by timestamp
   * @param {Function} rewardFn - (s_t, a_t, s_{t+1}) => reward
   * @returns {Array} transitions ready for CSV
   */
  static buildTransitions(snapshots, rewardFn) {
    if (!snapshots || snapshots.length < 2) {
      console.warn("[TransitionBuilder] Need at least 2 snapshots");
      return [];
    }

    const transitions = [];

    // Pair consecutive snapshots
    for (let i = 0; i < snapshots.length - 1; i++) {
      const snapshot_t = snapshots[i];
      const snapshot_t1 = snapshots[i + 1];

      // Build state vectors
      const s_t = snapshotToStateVector(snapshot_t);
      const s_t1 = snapshotToStateVector(snapshot_t1);

      if (!s_t || !s_t1) {
        console.warn(`[TransitionBuilder] Skipping pair ${i}`);
        continue;
      }

      // Action taken at time t
      const a_t = snapshot_t.action || 0;

      // Reward from transition
      const r_t = rewardFn ? rewardFn(s_t, a_t, s_t1) : 0.0;

      // Done flag
      const done = snapshot_t1.done ? 1 : 0;

      // Build transition
      const transition = {
        s: s_t,
        a: a_t,
        r: r_t,
        s_prime: s_t1,
        done: done,
        metadata: {
          timestamp_t: snapshot_t.timestamp,
          timestamp_t1: snapshot_t1.timestamp,
          session_id: snapshot_t.sessionId,
          flow_id: snapshot_t.flowId,
        },
      };

      transitions.push(transition);
    }

    console.log(
      `[TransitionBuilder] Built ${transitions.length} transitions from ${snapshots.length} snapshots`,
    );
    return transitions;
  }

  /**
   * Convert transitions to CSV format (47 columns)
   * Format: s_cols | a | r | next_s_cols | done
   */
  static toCSV(transitions) {
    if (!transitions || transitions.length === 0) {
      console.warn("[TransitionBuilder] No transitions to export");
      return null;
    }

    // State column names (in order)
    const stateColumns = [
      "s_session_duration",
      "s_total_distance",
      "s_num_actions",
      "s_num_clicks",
      "s_mean_time_per_action",
      "s_vel_mean",
      "s_vel_std",
      "s_accel_mean",
      "s_accel_std",
      "s_curve_mean",
      "s_curve_std",
      "s_jerk_mean",
      "s_persona_novice_old",
      "s_persona_intermediate",
      "s_persona_expert",
    ];

    // CSV header
    const nextStateColumns = stateColumns.map((col) =>
      col.replace("s_", "next_s_"),
    );
    const header = [
      ...stateColumns,
      "action",
      "reward",
      ...nextStateColumns,
      "done",
    ];

    // CSV rows
    const rows = transitions.map((t) => {
      const s_values = stateColumns.map((col) => (t.s[col] ?? 0).toFixed(6));
      const s_prime_values = stateColumns.map((col) =>
        (t.s_prime[col] ?? 0).toFixed(6),
      );

      return [...s_values, t.a, t.r.toFixed(6), ...s_prime_values, t.done].join(
        ",",
      );
    });

    const csv = [header.join(","), ...rows].join("\n");

    console.log(
      `[TransitionBuilder] Generated CSV with ${transitions.length} rows and ${header.length} columns`,
    );
    return csv;
  }

  /**
   * Validate transitions (sanity checks)
   */
  static validate(transitions) {
    if (!transitions || transitions.length === 0) {
      return { valid: false, errors: ["No transitions"] };
    }

    const errors = [];

    for (let i = 0; i < Math.min(transitions.length, 10); i++) {
      const t = transitions[i];

      // Check state vector
      if (!t.s || Object.keys(t.s).length !== 15) {
        errors.push(`Transition ${i}: state vector wrong size`);
      }

      // Check action
      if (t.a < 0 || t.a > 9) {
        errors.push(`Transition ${i}: invalid action ${t.a}`);
      }

      // Check persona one-hot
      const persona_sum =
        (t.s.s_persona_novice_old || 0) +
        (t.s.s_persona_intermediate || 0) +
        (t.s.s_persona_expert || 0);
      if (Math.abs(persona_sum - 1.0) > 0.001) {
        errors.push(
          `Transition ${i}: persona one-hot sum = ${persona_sum}, expected 1.0`,
        );
      }

      // Check done
      if (t.done !== 0 && t.done !== 1) {
        errors.push(`Transition ${i}: invalid done flag ${t.done}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      checked: Math.min(transitions.length, 10),
    };
  }
}

export default TransitionBuilder;
