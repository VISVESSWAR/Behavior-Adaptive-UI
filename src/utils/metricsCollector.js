/**
 * DQN-Compatible Metrics Collector
 * Collects UI metrics in format compatible with DQN training pipeline
 *
 * State columns (15 total):
 *   - 12 behavioral metrics
 *   - 3 persona one-hot columns
 *
 * Output format: JSON for IndexedDB, CSV for training
 */

import { adaptMetrics } from "../persona/metricAdapter";

class MetricsCollector {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.stateBuffer = null;
    this.transitions = []; // Collects (s, a, r, s', done) tuples
    this.metricsHistory = [];
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build state vector matching dqn_state_cols_v2.json
   * 15 columns total
   */
  buildStateVector(rawMetrics, persona) {
    if (!rawMetrics || !persona) return null;

    // Adapted (normalized 0-1) metrics
    const adapted = adaptMetrics(rawMetrics);

    // One-hot encode persona (exactly one must be 1.0)
    const personaOneHot = {
      s_persona_novice_old: persona.persona === "novice_old" ? 1.0 : 0.0,
      s_persona_intermediate: persona.persona === "intermediate" ? 1.0 : 0.0,
      s_persona_expert: persona.persona === "expert" ? 1.0 : 0.0,
    };

    // 12 behavioral metrics + 3 persona columns = 15 total
    return {
      // Behavioral metrics (from raw + adapted)
      s_session_duration: rawMetrics.s_session_duration || 0,
      s_total_distance: rawMetrics.s_total_distance || 0,
      s_num_actions: rawMetrics.s_num_actions || 0,
      s_num_clicks: rawMetrics.s_num_clicks || 0,
      s_mean_time_per_action: adapted.hesitation,
      s_vel_mean: adapted.vel_mean,
      s_vel_std: rawMetrics.s_vel_std || 0,
      s_accel_mean: rawMetrics.s_accel_mean || 0,
      s_accel_std: rawMetrics.s_accel_std || 0,
      s_curve_mean: rawMetrics.s_curve_mean || 0,
      s_curve_std: rawMetrics.s_curve_std || 0,
      s_jerk_mean: rawMetrics.s_jerk_mean || 0,

      // Persona one-hot encoding
      ...personaOneHot,
    };
  }

  /**
   * Compute reward using same logic as simulate_training_equivalent
   * Can be replaced with actual function call if available
   */
  computeReward(state, action, nextState) {
    // Placeholder: use simple heuristic
    // In production: call simulate_training_equivalent(state, action)

    let reward = 0.0;

    // Reward for reducing misclicks (proxy: success indicator)
    // This should match your reward_logic
    if (action === 1 && nextState.s_num_clicks < state.s_num_clicks) {
      reward += 0.1;
    }

    // Reward for task completion (if done)
    // This is computed separately in createTransition

    return reward;
  }

  /**
   * Create a transition (s, a, r, s', done)
   * Called when:
   *   - Action is applied by UI adapter
   *   - 10s metric window completes
   *   - Step changes
   *   - Flow completes
   */
  createTransition(state, action, reward, nextState, done) {
    if (!state || action === undefined || nextState === undefined) {
      console.warn("[MetricsCollector] Invalid transition data");
      return null;
    }

    const transition = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      state,
      action, // Integer 0-9
      reward, // Float
      next_state: nextState,
      done: done ? 1 : 0,
    };

    this.transitions.push(transition);
    this.stateBuffer = nextState; // Update buffer for next transition

    console.log(
      `[MetricsCollector] Transition recorded: action=${action}, reward=${reward.toFixed(3)}, done=${done}`,
    );

    return transition;
  }

  /**
   * Record metrics snapshot (called periodically, e.g., every 10s)
   */
  recordMetrics(rawMetrics, persona, uiState, flowId, stepId) {
    if (!rawMetrics || !persona) return null;

    const state = this.buildStateVector(rawMetrics, persona);
    if (!state) return null;

    const snapshot = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      flowId,
      stepId,
      state,
      uiState, // For reference, not in training
      persona: persona.persona,
      confidence: persona.confidence,
    };

    this.metricsHistory.push(snapshot);

    // Auto-create transition if buffer exists
    if (
      this.stateBuffer &&
      JSON.stringify(this.stateBuffer) !== JSON.stringify(state)
    ) {
      const reward = 0.0; // Will be computed later or externally
      this.createTransition(this.stateBuffer, 0, reward, state, 0);
    }

    this.stateBuffer = state;
    return snapshot;
  }

  /**
   * Export collected transitions as CSV (for training)
   * Format: matches dqn_state_cols_v2.json
   */
  exportAsCSV() {
    if (this.transitions.length === 0) {
      console.warn("[MetricsCollector] No transitions to export");
      return null;
    }

    // CSV header (15 state cols + action + reward + 15 next_state cols + done)
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

    const nextStateColumns = stateColumns.map((col) => `next_${col}`);

    const header = [
      ...stateColumns,
      "action",
      "reward",
      ...nextStateColumns,
      "done",
    ];

    const rows = this.transitions.map((t) => {
      const stateValues = stateColumns.map((col) => t.state[col] || 0);
      const nextStateValues = nextStateColumns.map(
        (col) => t.next_state[col.replace("next_", "")] || 0,
      );

      return [
        ...stateValues,
        t.action,
        t.reward,
        ...nextStateValues,
        t.done,
      ].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");

    console.log(
      `[MetricsCollector] Exported ${this.transitions.length} transitions as CSV`,
    );
    return csv;
  }

  /**
   * Export as JSON (for IndexedDB storage)
   */
  exportAsJSON() {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      transitionCount: this.transitions.length,
      metricsCount: this.metricsHistory.length,
      transitions: this.transitions,
      metricsHistory: this.metricsHistory,
    };
  }

  /**
   * Clear session data
   */
  clear() {
    this.transitions = [];
    this.metricsHistory = [];
    this.stateBuffer = null;
    this.sessionId = this.generateSessionId();
    console.log("[MetricsCollector] Session cleared");
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    if (this.transitions.length === 0) {
      return null;
    }

    const rewards = this.transitions.map((t) => t.reward);
    const avgReward = rewards.reduce((a, b) => a + b, 0) / rewards.length;
    const doneCount = this.transitions.filter((t) => t.done === 1).length;

    return {
      sessionId: this.sessionId,
      transitionCount: this.transitions.length,
      averageReward: avgReward.toFixed(3),
      completedFlows: doneCount,
      timestamp: Date.now(),
    };
  }
}

export default MetricsCollector;
