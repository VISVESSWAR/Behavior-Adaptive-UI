/**
 * Simplified Metrics Collector (Snapshot-Based)
 *
 * CORRECT APPROACH:
 * - Collect ONE snapshot every 10s (metrics + persona + action)
 * - Store snapshots chronologically
 * - CSV is built later by pairing consecutive snapshots
 * - Reward is computed post-hoc from (s_t, a_t, s_{t+1})
 */

import { snapshotToStateVector, TransitionBuilder } from "./snapshotSchema.js";

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

    const snapshot = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      flowId: this.flowId,
      stepId: this.stepId,

      metrics: { ...this.windowMetrics },

      persona: { ...this.currentPersona },

      action: this.currentAction, // Action that was just applied

      uiState: this.currentUIState || {},

      done: false, // Will be set to true when flow completes
    };

    this.snapshots.push(snapshot);
    this.lastCollectionTime = Date.now();

    console.log(
      `[MetricsCollector] Snapshot collected: ${this.snapshots.length} total`,
      {
        persona: this.currentPersona.type,
        action: this.currentAction,
      },
    );

    return snapshot;
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
