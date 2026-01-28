/**
 * Simplified Metrics Collector (Snapshot-Based)
 *
 * CORRECT APPROACH:
 * - Collect ONE snapshot every 10s (metrics + persona + action)
 * - Store snapshots chronologically
 * - CSV is built later by pairing consecutive snapshots
 * - Reward is computed post-hoc from (s_t, a_t, s_{t+1})
 */

import { TransitionBuilder } from "./snapshotSchema.js";
import IndexedDBManager from "./indexedDBManager.js";

export class MetricsCollector {
  constructor(sessionId, flowId, stepId) {
    this.sessionId = sessionId;
    this.flowId = flowId;
    this.stepId = stepId;
    this.snapshots = [];
    this.collectionInterval = 10000; // 10 seconds
    this.lastCollectionTime = Date.now();
    this.windowMetrics = null;
    this.currentAction = -1; // No action yet
    this.currentPersona = null;
    this.currentUIState = null;
    this.currentTaskData = null; // Task tracking data
    this.personaConfidence = null; // Store persona confidence separately
    this.dbManager = new IndexedDBManager();
    this.dbManager
      .init()
      .catch((err) =>
        console.error("[MetricsCollector] Failed to init DB", err),
      );
  }

  /**
   * Called by hooks to update current metrics
   * (does NOT create snapshot yet)
   */
  updateMetrics(metrics) {
    this.windowMetrics = metrics;
  }

  /**
   * Called when UI action is applied
   */
  recordAction(actionId) {
    this.currentAction = actionId;
  }

  /**
   * Called with persona detection
   */
  updatePersona(persona) {
    this.currentPersona = persona;
  }

  /**
   * Called with current UI state
   */
  updateUIState(uiState) {
    this.currentUIState = uiState;
  }

  /**
   * Update task data for snapshot inclusion
   */
  updateTaskData(taskData) {
    this.currentTaskData = taskData;
  }

  /**
   * Calculate task-based reward
   * +0.5 if completed
   * -0.3 if timeout
   * -0.01 × pathLength penalty
   */
  calculateTaskReward(taskData) {
    if (!taskData) return 0;

    let reward = 0;

    // Bonus for completion
    if (taskData.completed) {
      reward += 0.5;
    }

    // Penalty for timeout
    if (taskData.failed) {
      reward -= 0.3;
    }

    // Path length penalty
    const pathLength = taskData.pathLength || 0;
    reward -= 0.01 * pathLength;

    return reward;
  }

  /**
   * Check if it's time to collect a snapshot
   * Call this from a timer or on user interaction
   */
  shouldCollect() {
    return Date.now() - this.lastCollectionTime >= this.collectionInterval;
  }

  /**
   * Collect ONE snapshot (if enough time has passed)
   * This is the ONLY place where snapshots are created
   */
  collectSnapshot() {
    if (!this.shouldCollect()) {
      return null;
    }

    if (!this.windowMetrics || !this.currentPersona) {
      console.warn(
        "[MetricsCollector] Cannot collect snapshot - missing metrics or persona",
      );
      return null;
    }

    // Calculate elapsed time and task data
    const elapsedTime = Date.now() - this.lastCollectionTime;
    const taskData = this.currentTaskData || {};
    const taskReward = this.calculateTaskReward(taskData);

    const snapshot = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      flowId: this.flowId,
      stepId: this.stepId,

      metrics: { ...this.windowMetrics },

      persona: {
        ...this.currentPersona,
        confidence:
          this.personaConfidence !== null
            ? this.personaConfidence
            : this.currentPersona?.confidence,
      },

      action: this.currentAction, // Action that was just applied

      uiState: this.currentUIState || {},

      // Include task data in snapshot
      task: {
        completed: taskData.completed || false,
        elapsedTime: taskData.elapsedTime || 0,
        timeLimit: taskData.timeLimit || 0,
        pathLength: taskData.pathLength || 0,
      },

      taskReward: taskReward,

      done: false, // Will be set to true when flow completes
    };

    this.snapshots.push(snapshot);
    this.lastCollectionTime = Date.now();

    // Save to IndexedDB for persistence
    this.dbManager
      .saveTransition({
        ...snapshot,
        state: this.buildStateVector(this.windowMetrics, this.currentPersona),
        next_state: this.buildStateVector(
          this.windowMetrics,
          this.currentPersona,
        ),
        reward: taskReward,
      })
      .catch((err) =>
        console.error("[MetricsCollector] Failed to save snapshot", err),
      );

    console.log(
      `[MetricsCollector] Snapshot collected: ${this.snapshots.length} total`,
      {
        persona: this.currentPersona?.persona || this.currentPersona?.type,
        action: this.currentAction,
      },
    );

    return snapshot;
  }

  /**
   * Build state vector matching DQN format
   */
  buildStateVector(metrics, persona) {
    if (!metrics || !persona) return null;

    const personaType = persona.persona || persona.type || "intermediate";
    return {
      s_session_duration: metrics.s_session_duration || 0,
      s_total_distance: metrics.s_total_distance || 0,
      s_num_actions: metrics.s_num_actions || 0,
      s_num_clicks: metrics.s_num_clicks || 0,
      s_mean_time_per_action: metrics.s_mean_time_per_action || 0,
      s_vel_mean: metrics.s_vel_mean || 0,
      s_vel_std: metrics.s_vel_std || 0,
      s_accel_mean: metrics.s_accel_mean || 0,
      s_accel_std: metrics.s_accel_std || 0,
      s_curve_mean: metrics.s_curve_mean || 0,
      s_curve_std: metrics.s_curve_std || 0,
      s_jerk_mean: metrics.s_jerk_mean || 0,
      s_persona_novice_old: personaType === "novice_old" ? 1.0 : 0.0,
      s_persona_intermediate: personaType === "intermediate" ? 1.0 : 0.0,
      s_persona_expert: personaType === "expert" ? 1.0 : 0.0,
    };
  }

  /**
   * Mark flow as complete
   */
  completeFlow() {
    if (this.snapshots.length > 0) {
      this.snapshots[this.snapshots.length - 1].done = true;
    }
  }

  /**
   * Get all collected snapshots
   */
  getSnapshots() {
    return this.snapshots;
  }

  /**
   * Build transitions (for internal use or testing)
   * @param {Function} rewardFn - (s_t, a_t, s_{t+1}) => reward
   */
  buildTransitions(rewardFn) {
    return TransitionBuilder.buildTransitions(this.snapshots, rewardFn);
  }

  /**
   * Export as JSON (snapshots)
   */
  toJSON() {
    return {
      metadata: {
        sessionId: this.sessionId,
        flowId: this.flowId,
        createdAt: new Date().toISOString(),
        snapshotCount: this.snapshots.length,
      },
      snapshots: this.snapshots,
    };
  }

  /**
   * Export as CSV (requires pairing + reward function)
   * @param {Function} rewardFn - computes reward from transition
   */
  toCSV(rewardFn) {
    const transitions = this.buildTransitions(rewardFn);
    return TransitionBuilder.toCSV(transitions);
  }

  /**
   * Validate collected data
   */
  validate() {
    const transitions = this.buildTransitions(() => 0);
    return TransitionBuilder.validate(transitions);
  }
}

/**
 * INTEGRATION EXAMPLE
 *
 * In App.js or UIContext.js:
 *
 *   const collector = new MetricsCollector("session_123", "transaction", "confirm");
 *
 *   // Hook updates metrics
 *   useEffect(() => {
 *     collector.updateMetrics(metrics);
 *   }, [metrics]);
 *
 *   // Action applied
 *   const handleAdaptation = (action) => {
 *     applyAction(action);
 *     collector.recordAction(action.id);
 *   };
 *
 *   // Persona updated
 *   useEffect(() => {
 *     collector.updatePersona(persona);
 *   }, [persona]);
 *
 *   // Periodic collection (every 10s)
 *   useEffect(() => {
 *     const timer = setInterval(() => {
 *       collector.collectSnapshot();
 *     }, 10000);
 *     return () => clearInterval(timer);
 *   }, []);
 *
 *   // On flow complete
 *   const handleComplete = () => {
 *     collector.completeFlow();
 *     const csv = collector.toCSV(rewardFunction);
 *     // save to IndexedDB
 *   };
 */

export default MetricsCollector;
