/**
 * Simplified Metrics Collector (Snapshot-Based)
 *
 * CORRECT APPROACH:
 * - Collect ONE snapshot every 10s (metrics + persona + action)
 * - Store snapshots chronologically
 * - CSV is built later by pairing consecutive snapshots
 * - Reward is computed post-hoc from (s_t, a_t, s_{t+1})
 * 
 * EXPLORATION:
 * - Uses epsilon-greedy strategy for action selection
 * - Balances exploitation (model action) vs exploration (random action)
 * - Epsilon decays over time to shift from exploration to exploitation
 */

import { TransitionBuilder } from "./snapshotSchema.js";
import IndexedDBManager from "./indexedDBManager.js";
import { metricsToStateVector, getDQNAction } from "./dqnAdapter.js";
import EpsilonGreedyExplorer from "./epsilonGreedy.js";
import { getCooldownManager } from "../adaptation/personaActionMapper.js";

const STATE_COL_ORDER = [
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
  "s_persona_expert"
];

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
    this.currentDQNAction = -1; // DQN action fetched at snapshot time
    this.currentPersona = null;
    this.currentUIState = null;
    this.currentTaskData = null; // Task tracking data
    this.personaConfidence = null; // Store persona confidence separately
    this.isIdle = false; // Idle state flag - gates DQN inference
    
    // Human-in-the-loop feedback
    // Most recent feedback from Like/Dislike buttons (default 0 = no feedback)
    // Attached to next snapshot and used in RL training:
    // final_reward = system_reward + 0.5 * feedback
    this.latestFeedback = 0;
    
    // Epsilon-greedy exploration
    this.explorer = new EpsilonGreedyExplorer(0.4, 0.1, 0.995);
    this.lastActionSource = null; // Track action source for logging
    
    this.dbManager = new IndexedDBManager();
    this.dbManager
      .init()
      .catch((err) =>
        console.error("[MetricsCollector] Failed to init DB", err),
      );
  }

  /**
   * Update idle state (called by useIdleTimer hook)
   * When idle, DQN inference is skipped and noop action (0) is used
   */
  setIdleState(isIdle) {
    this.isIdle = isIdle;
    if (isIdle) {
      console.log("[MetricsCollector] Idle state activated - DQN inference paused");
    } else {
      console.log("[MetricsCollector] Idle state cleared - DQN inference resumed");
    }
  }

  /**
   * Set latest feedback from human-in-the-loop system
   * Called when user clicks Like (+1) or Dislike (-1) buttons
   * Attached to next snapshot for RL training
   *
   * @param {number} feedback - User feedback value: +1 (like), -1 (dislike), 0 (none)
   */
  setLatestFeedback(feedback) {
    this.latestFeedback = feedback;
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
   * CRITICAL: This is the ONLY place where:
   * 1. Snapshots are created
   * 2. DQN actions are fetched (tied to 10-second window)
   * 3. Actions are recorded for RL training
   * 4. Epsilon-greedy exploration is applied (DECAYS ONCE HERE per decision)
   * 
   * CRITICAL: ALWAYS collect snapshots, even during idle
   * - Idle just gates the DQN action (set to 0) with flag
   * - Never skip snapshots - preserves consistent 10-second decision cadence
   * - RL training depends on consistent snapshot timing
   * 
   * IDLE GATING:
   * - If isIdle is true, skip DQN inference
   * - Use noop action (0) instead
   * - Set isIdleGated flag for RL analysis
   * - Do not log reward changes (freeze learning)
   * 
   * EPSILON-GREEDY:
   * - After DQN action is received, apply exploration strategy
   * - With probability eps: select random action (exploration)
   * - With probability 1-eps: use model action (exploitation)
   * - Decay epsilon ONCE per decision cycle (in explorer.selectAction)
   * - Log action source and epsilon for RL analysis
   */
  async collectSnapshot() {
    if (!this.shouldCollect()) {
      return null;
    }

    // CRITICAL: Even if metrics/persona missing, collect snapshot with defaults
    // Never skip snapshots - preserves consistent 10-second timing
    if (!this.windowMetrics || !this.currentPersona) {
      console.warn(
        "[MetricsCollector] Snapshot collection: missing metrics or persona, using defaults",
      );
      // Use NULL/UNKNOWN values to avoid misleading training data
      // ⚠️ CRITICAL: Don't use "low" defaults - makes idle look like perfect state
      if (!this.windowMetrics) {
        this.windowMetrics = {
          totalFocusTime: null,
          misclicks: null,  // null = unknown (don't calculate performance reward)
          scrolls: null,
          clicks: null,
          scrollDepth: null,
          focusTime: null,
          taskDuration: null,
          mouseSpeed: null,  // null = unknown speed
          uiSaturation: { text: null, spacing: null, button: null },  // null metrics
        };
      }
      if (!this.currentPersona) {
        this.currentPersona = {
          name: "unknown",
          characteristics: {},
          confidence: 0.5,
        };
      }
    }

    // IDLE GATE: Skip DQN inference when user is idle
    let dqnAction = -1;
    let finalAction = -1;
    let actionSource = "idle"; // Track source: idle | model | explore
    let idleGated = false;
    let explorationData = null;

    if (this.isIdle) {
      // Idle: return noop action (0), do not request DQN inference
      dqnAction = 0;
      finalAction = 0;
      idleGated = true;
      actionSource = "idle";
      this.currentDQNAction = dqnAction;
      console.log(`[MetricsCollector] IDLE - Using noop action (0), DQN inference paused`);
    } else {
      // Not idle: proceed with DQN action request
      try {
        const stateVector = metricsToStateVector(this.windowMetrics, this.currentPersona);
        if (stateVector) {
          dqnAction = await getDQNAction(stateVector);
          this.currentDQNAction = dqnAction;
          console.log(`[MetricsCollector] DQN action fetched at snapshot time: ${dqnAction}`);

          // EPSILON-GREEDY: Apply exploration strategy after getting model action
          if (dqnAction >= 0) {
            const explorationResult = this.explorer.selectAction(dqnAction);
            finalAction = explorationResult.action;
            actionSource = explorationResult.source;
            explorationData = {
              modelAction: dqnAction,
              finalAction: finalAction,
              source: actionSource,
              epsilon: explorationResult.epsilon,
              nextEpsilon: explorationResult.nextEpsilon,
            };

            const sourceLabel = actionSource === "model" ? "🎯 EXPLOIT" : "🎲 EXPLORE";
            console.log(
              `[MetricsCollector] ${sourceLabel} - Model: ${dqnAction}, Final: ${finalAction}, Epsilon: ${explorationResult.epsilon.toFixed(3)}`
            );
          } else {
            // Model action invalid, use noop
            finalAction = 0;
            actionSource = "fallback";
            console.log(`[MetricsCollector] DQN returned invalid action, using noop`);
          }
        }
      } catch (error) {
        console.error("[MetricsCollector] Failed to fetch DQN action:", error);
        dqnAction = -1; // Fallback to rule-based
        finalAction = 0;
        actionSource = "error";
      }
    }

    // Store last action source for reference
    this.lastActionSource = actionSource;

    // Check cooldown masking - was this action blocked by cooldown?
    // ⚠️ CRITICAL: If DQN suggested text_up but cooldown blocked it → finalAction=0
    // Without this log, RL thinks action=0 is what DQN wanted (CORRUPTION!)
    let cooldownMasked = false;
    if (dqnAction >= 0 && finalAction >= 0) {
      const cooldownMgr = getCooldownManager();
      if (cooldownMgr && finalAction !== dqnAction) {
        // Action changed - check if due to cooldown
        cooldownMasked = cooldownMgr.isOnCooldown(dqnAction);
        if (cooldownMasked) {
          console.log(
            `[MetricsCollector] COOLDOWN MASKED: DQN wanted action ${dqnAction}, but got ${finalAction} due to cooldown`
          );
        }
      }
    }

    // Calculate elapsed time and task data
    const elapsedTime = Date.now() - this.lastCollectionTime;
    const taskData = this.currentTaskData || {};
    
    // ⚠️ CRITICAL: Skip reward calculations when metrics are null (unknown)
    // Idle/cooldown periods should be reward-neutral, not "perfect performance"
    const metricsAreValid = this.windowMetrics && 
      this.windowMetrics.misclicks !== null &&
      this.windowMetrics.mouseSpeed !== null;
    const taskReward = (!metricsAreValid || idleGated) ? 0 : this.calculateTaskReward(taskData);

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

      // CRITICAL: For RL training, use finalAction (after epsilon-greedy)
      // finalAction will be applied during the NEXT window and influence the next state
      // This preserves causality: (S_t, A_t, S_{t+1}) where A_t is finalAction from THIS snapshot
      // IDLE: When idle, finalAction = 0 (noop)
      action: finalAction,         // ✅ Final action chosen (after exploration)
      dqnAction: dqnAction,        // Model action before exploration
      finalAction: finalAction,    // Action actually applied (may differ from dqnAction)
      ruleBasedAction: this.currentAction, // Fallback action (for reference only)
      isIdleGated: idleGated,      // Flag for learning to skip this transition
      
      // Exploration tracking for RL analysis
      actionSource: actionSource,  // "model" | "explore" | "idle" | "fallback" | "error"
      explorationData: explorationData, // { modelAction, finalAction, source, epsilon, nextEpsilon }

      // Human-in-the-loop feedback (attached to this snapshot)
      // Used in RL training: final_reward = system_reward + 0.5 * feedback
      userFeedback: this.latestFeedback, // +1 (like), -1 (dislike), 0 (none)

      // CRITICAL: Masking info - which gating mechanisms applied
      // Used for RL analysis: filter/understand which transitions were gated
      maskingInfo: {
        idleGated: idleGated,      // True if user was idle (> 5s), action set to 0
      },

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
    
    // Reset feedback after attaching to snapshot (one-time use)
    this.latestFeedback = 0;

    // Save to IndexedDB for persistence
    this.dbManager
      .saveTransition({
        ...snapshot,
        state: this.buildStateVector(this.windowMetrics, this.currentPersona),
        next_state: this.buildStateVector(
          this.windowMetrics,
          this.currentPersona,
        ),
        reward: 0,
      })
      .catch((err) =>
        console.error("[MetricsCollector] Failed to save snapshot", err),
      );

    console.log(
      `[MetricsCollector] Snapshot collected: ${this.snapshots.length} total`,
      {
        persona: this.currentPersona?.persona || this.currentPersona?.type,
        modelAction: dqnAction,
        finalAction: finalAction,
        source: actionSource,
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

    const s = {
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
      s_persona_novice_old: personaType === "novice_old" ? 1 : 0,
      s_persona_intermediate: personaType === "intermediate" ? 1 : 0,
      s_persona_expert: personaType === "expert" ? 1 : 0,
    };

    // Convert object → ordered array
    return STATE_COL_ORDER.map(k => s[k]);
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
   * Get epsilon-greedy exploration statistics
   * @returns {Object} explorer stats including epsilon, exploration rate, etc.
   */
  getExplorerStats() {
    return this.explorer.getStats();
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
        explorationStats: this.getExplorerStats(),
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
   * Validate snapshot consistency - ensures all fields are present
   * ⚠️ CRITICAL: Call this before training to catch missing fields early
   * @returns {object} validation report with any missing fields
   */
  validate() {
    if (this.snapshots.length === 0) {
      return { valid: false, reason: "No snapshots collected" };
    }

    // Required fields in every snapshot
    const requiredFields = [
      "timestamp",
      "state",
      "action",
      "reward",
      "next_state",
      "userFeedback",
      "actionSource",
      "maskingInfo",
    ];

    // Required subfields in maskingInfo
    const maskingInfoFields = [
      "idleGated",
      "cooldownMasked",
      "metricsNull",
      "modelAction",
      "finalAction",
    ];

    let missingFields = new Set();
    let missingMaskingFields = new Set();

    // Check all snapshots for consistency
    for (const snap of this.snapshots) {
      for (const field of requiredFields) {
        if (!(field in snap)) {
          missingFields.add(field);
        }
      }
      if (snap.maskingInfo) {
        for (const field of maskingInfoFields) {
          if (!(field in snap.maskingInfo)) {
            missingMaskingFields.add(field);
          }
        }
      } else {
        missingFields.add("maskingInfo");
      }
    }

    const isValid = missingFields.size === 0 && missingMaskingFields.size === 0;

    return {
      valid: isValid,
      totalSnapshots: this.snapshots.length,
      missingFields: Array.from(missingFields),
      missingMaskingFields: Array.from(missingMaskingFields),
    };
  }

  /**
   * Print 10 random snapshots for debugging
   * ⚠️ CRITICAL: Run this before training to verify all fields present
   */
  printSampleSnapshots() {
    if (this.snapshots.length === 0) {
      console.warn("[MetricsCollector] No snapshots to print");
      return;
    }

    console.log("\n" + "=".repeat(80));
    console.log("SNAPSHOT SAMPLE (10 random snapshots)");
    console.log("=".repeat(80));

    const sampleSize = Math.min(10, this.snapshots.length);
    const sampleIndices = [];
    for (let i = 0; i < sampleSize; i++) {
      const idx = Math.floor(Math.random() * this.snapshots.length);
      sampleIndices.push(idx);
    }

    sampleIndices.forEach((idx, i) => {
      const snap = this.snapshots[idx];
      console.log(`\n[${i + 1}] Snapshot #${idx}`);
      console.log(`  timestamp: ${snap.timestamp}`);
      console.log(`  state: ${snap.state ? "✓" : "✗ MISSING"}`);
      console.log(`  action: ${snap.action}`);
      console.log(`  reward: ${snap.reward}`);
      console.log(`  next_state: ${snap.next_state ? "✓" : "✗ MISSING"}`);
      console.log(`  userFeedback: ${snap.userFeedback}`);
      console.log(`  actionSource: ${snap.actionSource}`);
      console.log(`  maskingInfo:`);
      if (snap.maskingInfo) {
        console.log(`    - idleGated: ${snap.maskingInfo.idleGated}`);
        console.log(`    - cooldownMasked: ${snap.maskingInfo.cooldownMasked}`);
        console.log(`    - metricsNull: ${snap.maskingInfo.metricsNull}`);
        console.log(`    - modelAction: ${snap.maskingInfo.modelAction}`);
        console.log(`    - finalAction: ${snap.maskingInfo.finalAction}`);
      } else {
        console.log(`    ✗ MISSING maskingInfo!`);
      }
    });

    console.log("\n" + "=".repeat(80));
    const validation = this.validate();
    console.log("VALIDATION RESULT:");
    console.log(`  Valid: ${validation.valid ? "✓ YES" : "✗ NO"}`);
    if (!validation.valid) {
      if (validation.missingFields.length > 0) {
        console.log(`  Missing fields: ${validation.missingFields.join(", ")}`);
      }
      if (validation.missingMaskingFields.length > 0) {
        console.log(`  Missing maskingInfo fields: ${validation.missingMaskingFields.join(", ")}`);
      }
    }
    console.log("=".repeat(80) + "\n");
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
