// Simplified Metrics Collector: Collect snapshots every 10s (metrics+persona+action), store chronologically, build CSV from consecutive snapshots, compute rewards post-hoc from (s_t, a_t, s_t+1)
// ALIGNED WITH taskReward.jsx: Task rewards use +0.6 (complete), -0.4 (timeout), -0.02 × pathLength, clipped to [-1, 1]

import { TransitionBuilder } from "./snapshotSchema.jsx";
import IndexedDBManager from "./indexedDBManager.jsx";
import {
  metricsToStateVector,
  getDQNAction,
  decideFinalAction,
  getExperimentMode,
} from "./dqnAdapter.jsx";
import EpsilonGreedyExplorer from "./epsilonGreedy.jsx";
import { getCooldownManager } from "../adaptation/personaActionMapper.jsx";
import { appendRLLog, exportRLLogs, clearRLLogs } from "./rlLogger.jsx";

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
  "s_persona_expert",
  "s_ui_button_level",
  "s_ui_text_level",
  "s_ui_spacing_level",
  "s_ui_font_level",
];

// Opposite action pairs for feedback-reverse (user dislike → apply opposite)
const oppositeActionMap = {
  0: 0, // noop → noop
  1: 2,
  2: 1, // button_up ↔ button_down
  3: 4,
  4: 3, // text_up ↔ text_down
  5: 6,
  6: 5, // font_up ↔ font_down
  7: 8,
  8: 7, // spacing_up ↔ spacing_down
  9: 9, // enable_tooltips → enable_tooltips
};

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
    this.currentUIState = {
      buttonSize: 0,
      textSize: 0,
      fontWeight: 0,
      spacing: 0,
      borderRadius: 0,
      shadowLevel: 0,
      lineHeight: 0,
      iconSize: 0,
      cardPadding: 0,
      tooltips: false,
    };
    this.currentTaskData = null; // Task tracking data
    this.personaConfidence = null; // Store persona confidence separately
    this.isIdle = false; // Idle state flag - gates DQN inference

    // Transaction tracking (tied to snapshot windows)
    this.transactionStatus = {
      active: false,
      transactionId: null,
      startTime: null,
      completeReason: null, // "auto" or "user"
    };

    // User feedback from Like/Dislike buttons (attached to snapshot for RL training)
    this.latestFeedback = 0;

    // Feedback override for next decision: "repeat", "reverse", or "neutral" (one-time effect)
    this.feedbackOverride = {
      active: false,
      type: null, // "repeat" | "reverse" | "neutral"
      action: null,
    };

    // Epsilon-greedy exploration
    this.explorer = new EpsilonGreedyExplorer(0.4, 0.1, 0.995);
    this.lastActionSource = null; // Track action source for logging

    // Transaction path type assignment (random: bank_transfer, upi_payment, qr_payment)
    this.pathType = this.assignPathType();
    console.log(`[MetricsCollector] Assigned pathType: ${this.pathType}`);

    this.dbManager = new IndexedDBManager();
    this.dbReady = false; // Track initialization state

    // ⚠️ CRITICAL: Wait for DB to initialize before allowing collection
    this.dbManager
      .init()
      .then(() => {
        this.dbReady = true;
        console.log("[MetricsCollector] IndexedDB ready for data collection");
      })
      .catch((err) => {
        console.error(
          "[MetricsCollector] Failed to init DB - data will NOT be persisted:",
          err,
        );
      });
  }

  // Update idle state: when idle, skip DQN inference and use noop action
  setIdleState(isIdle) {
    this.isIdle = isIdle;
    if (isIdle) {
      console.log(
        "[MetricsCollector] Idle state activated - DQN inference paused",
      );
    } else {
      console.log(
        "[MetricsCollector] Idle state cleared - DQN inference resumed",
      );
    }
  }

  // Assign random transaction path type for experiment
  assignPathType() {
    const paths = ["bank_transfer", "upi_payment", "qr_payment"];
    const pathType = paths[Math.floor(Math.random() * paths.length)];
    console.log(`PATH: ${pathType}`);
    return pathType;
  }

  // Set feedback from Like (+1) / Dislike (-1) buttons for RL training
  setLatestFeedback(feedback) {
    this.latestFeedback = feedback;
  }

  // Start transaction tied to snapshot window (called on form submit)
  startTransaction() {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.transactionStatus = {
      active: true,
      transactionId: transactionId,
      startTime: Date.now(),
      completeReason: null,
    };

    // Expose to window for UI/debugger access
    if (typeof window !== "undefined") {
      window.__metricsCollector = window.__metricsCollector || {};
      window.__metricsCollector.transactionStatus = this.transactionStatus;
    }

    console.log(`[MetricsCollector] Transaction started: ${transactionId}`);
    return transactionId;
  }

  // Complete transaction: reason = "auto" (10s elapsed) or "user" (user-initiated)
  completeTransaction(reason = "auto") {
    if (!this.transactionStatus.active) {
      console.warn("[MetricsCollector] No active transaction to complete");
      return null;
    }

    const completedTxn = {
      ...this.transactionStatus,
      completeReason: reason,
      endTime: Date.now(),
      duration: Date.now() - this.transactionStatus.startTime,
    };

    console.log(
      `[MetricsCollector] Transaction completed (${reason}): ${completedTxn.transactionId}, Duration: ${completedTxn.duration}ms`,
    );

    // Reset transaction status
    this.transactionStatus = {
      active: false,
      transactionId: null,
      startTime: null,
      completeReason: null,
    };

    // Update window reference
    if (typeof window !== "undefined") {
      window.__metricsCollector = window.__metricsCollector || {};
      window.__metricsCollector.transactionStatus = this.transactionStatus;
    }

    return completedTxn;
  }

  // Save transition with exponential backoff retry (max 3 retries, 100ms initial)
  async saveTransitionWithRetry(
    transition,
    maxRetries = 3,
    initialDelay = 100,
  ) {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Mark DB as ready if initialization completed
        if (!this.dbReady && this.dbManager.isConnectionValid()) {
          this.dbReady = true;
          console.log("[MetricsCollector] DB connection restored");
        }

        // Skip if DB not ready yet
        if (!this.dbReady) {
          console.warn(
            `[MetricsCollector] DB not ready (attempt ${attempt + 1}/${maxRetries})`,
          );
          lastError = new Error("DB not ready");

          // Wait before retrying
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, initialDelay * Math.pow(2, attempt)),
            );
          }
          continue;
        }

        // Try to save
        await this.dbManager.saveTransition(transition);
        return; // Success!
      } catch (err) {
        lastError = err;
        console.warn(
          `[MetricsCollector] Save failed (attempt ${attempt + 1}/${maxRetries}):`,
          err.message,
        );

        // If last attempt, log error but don't crash
        if (attempt === maxRetries - 1) {
          console.error(
            "[MetricsCollector] Failed to save transition after all retries:",
            lastError,
          );
          return;
        }

        // Wait with exponential backoff before retrying
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Update current metrics (does not create snapshot)
  updateMetrics(metrics) {
    this.windowMetrics = metrics;
  }

  // Called when UI action is applied
  recordAction(actionId) {
    this.currentAction = actionId;
  }

  // Called with persona detection
  updatePersona(persona) {
    this.currentPersona = persona;
  }

  // Called with current UI state
  updateUIState(uiState) {
    this.currentUIState = uiState;
  }

  // Update task data for snapshot inclusion
  updateTaskData(taskData) {
    this.currentTaskData = taskData;
  }

  // Update the identifiers used when building snapshots and sending to the DQN server
  // Called by useTaskTracking hook whenever route changes
  updateTaskIds(flowId, stepId) {
    this.flowId = flowId;
    this.stepId = stepId;
    console.log(
      `[MetricsCollector] Updated task identifiers: flowId=${flowId}, stepId=${stepId}`,
    );
  }

  // Calculate task reward: +0.6 (complete), -0.4 (timeout), -0.02 × pathLength; clipped to [-1, 1]
  // ALIGNED WITH: taskReward.jsx for consistency
  calculateTaskReward(taskData) {
    if (!taskData) return 0;

    let reward = 0;

    // Bonus for completion
    if (taskData.completed) {
      reward += 0.6;
    }

    // Penalty for timeout
    if (taskData.failed) {
      reward -= 0.4;
    }

    // Path length penalty
    const pathLength = taskData.pathLength || 0;
    reward -= 0.02 * pathLength;

    // Clip to [-1.0, 1.0] to match taskReward.jsx normalization
    return Math.max(-1.0, Math.min(1.0, reward));
  }

  // Check if it's time to collect a snapshot
  // Call this from a timer or on user interaction
  shouldCollect() {
    const shouldCollect =
      Date.now() - this.lastCollectionTime >= this.collectionInterval;
    if (shouldCollect) {
      console.log(
        `[MetricsCollector] shouldCollect=true (${Math.round(Date.now() - this.lastCollectionTime)}ms elapsed >= ${this.collectionInterval}ms)`,
      );
    }
    return shouldCollect;
  }

  // Collect snapshot: create DQN snapshot, fetch action, apply exploration, record for training; idle gates DQN to noop
  async collectSnapshot() {
    if (!this.shouldCollect()) {
      return null;
    }

    // Initialize snapshot timing if not already set
    if (!window.__metricsCollector) {
      window.__metricsCollector = {};
    }
    if (!window.__metricsCollector.snapshotStartTime) {
      window.__metricsCollector.snapshotStartTime = Date.now();
    }

    console.log(`[MetricsCollector] Starting snapshot collection...`, {
      dbReady: this.dbReady,
      hasMetrics: !!this.windowMetrics,
      hasPersona: !!this.currentPersona,
      snapshots: this.snapshots.length,
    });

    // CRITICAL: Even if metrics/persona missing, collect snapshot with defaults
    // Never skip snapshots - preserves consistent 10-second timing
    if (!this.windowMetrics || !this.currentPersona) {
      console.warn(
        "[MetricsCollector] Snapshot collection: missing metrics or persona, using defaults",
        {
          metricsNull: !this.windowMetrics,
          personaNull: !this.currentPersona,
        },
      );
      // Use NULL/UNKNOWN values to avoid misleading training data
      // ⚠️ CRITICAL: Don't use "low" defaults - makes idle look like perfect state
      if (!this.windowMetrics) {
        this.windowMetrics = {
          totalFocusTime: null,
          misclicks: null, // null = unknown (don't calculate performance reward)
          scrolls: null,
          clicks: null,
          scrollDepth: null,
          focusTime: null,
          taskDuration: null,
          mouseSpeed: null, // null = unknown speed
          uiSaturation: { text: null, spacing: null, button: null }, // null metrics
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
    let feedbackApplied = false; // Track if feedback override was applied

    // ============================================================
    // HUMAN-IN-THE-LOOP FEEDBACK OVERRIDE DETECTION
    // Applied to next decision only (then reset)
    // ============================================================
    // We'll check override AFTER we determine finalAction in each path
    const applyFeedbackOverride = (proposedAction, baseEpsilon = 0.4) => {
      const override = this.feedbackOverride;

      if (!override?.active) {
        return {
          action: proposedAction,
          source: actionSource,
          epsilon: baseEpsilon,
        };
      }

      let result = {
        action: proposedAction,
        source: actionSource,
        epsilon: baseEpsilon,
      };

      if (override.type === "repeat") {
        // User liked the previous action → repeat it
        result.action = override.action;
        result.source = "feedback-repeat";
        feedbackApplied = true;
        console.log(
          `[MetricsCollector] 👍 Feedback: Repeating action ${override.action}`,
        );
      } else if (override.type === "reverse") {
        // User disliked the previous action → apply opposite
        const oppositeAction = oppositeActionMap[override.action];
        if (oppositeAction !== undefined) {
          result.action = oppositeAction;
          result.source = "feedback-reverse";
          feedbackApplied = true;
          console.log(
            `[MetricsCollector] 👎 Feedback: Reversing action ${override.action} → ${oppositeAction}`,
          );
        }
      } else if (override.type === "neutral") {
        // User gave no feedback → boost exploration
        result.epsilon = Math.min(1.0, baseEpsilon + 0.2);
        result.source = "feedback-neutral-explore";
        feedbackApplied = true;
        console.log(
          `[MetricsCollector] 🤷 Feedback: Neutral detected, boosting epsilon to ${result.epsilon.toFixed(3)}`,
        );
      }

      // One-time effect: disable after applying
      if (feedbackApplied) {
        this.feedbackOverride.active = false;
      }

      return result;
    };

    if (this.isIdle) {
      // Idle: return noop action (0), do not request DQN inference
      dqnAction = 0;
      finalAction = 0;
      idleGated = true;
      actionSource = "idle";
      this.currentDQNAction = dqnAction;

      // 🔹 Store both model and final actions for UI + debugger
      if (typeof window !== "undefined") {
        window.__metricsCollector = window.__metricsCollector || {};
        window.__metricsCollector.currentModelAction = dqnAction;
        window.__metricsCollector.currentFinalAction = finalAction;
      }

      console.log(
        `[MetricsCollector] IDLE - Using noop action (0), DQN inference paused`,
      );

      // Apply feedback override if active (one-time effect per action)
      const override = applyFeedbackOverride(finalAction, 0.4);
      finalAction = override.action;
      actionSource = override.source;

      // 📊 Store decision source for debugger + RL analysis
      if (typeof window !== "undefined") {
        window.__metricsCollector = window.__metricsCollector || {};
        window.__metricsCollector.lastDecisionInfo = {
          modelProb: 0.3,
          randomProb: 0.5,
          antiProb: 0.2,
          source: actionSource,
          dqnAction: dqnAction,
          finalAction: finalAction,
          isIdleGated: true,
          timestamp: Date.now(),
          feedbackGiven: false,
        };
      }
    } else {
      // Not idle: proceed with DQN action request
      try {
        const stateVector = metricsToStateVector(
          this.windowMetrics,
          this.currentPersona,
          this.currentUIState,
        );
        if (stateVector) {
          const uxMetrics = computeUXMetrics(this.windowMetrics);

          dqnAction = await getDQNAction(stateVector, uxMetrics, this.flowId, this.stepId);
          this.currentDQNAction = dqnAction;
          console.log(
            `[MetricsCollector] DQN action fetched at snapshot time: ${dqnAction}`,
          );

          // EXPERIMENT MODE DECISION: Apply mode-specific strategy (model, random, or guided)
          if (dqnAction >= 0) {
            const decisionResult = decideFinalAction(dqnAction);
            finalAction = decisionResult.finalAction;
            actionSource = decisionResult.source;

            // Apply feedback override if active (one-time effect per action)
            const override = applyFeedbackOverride(finalAction, 0.4);
            finalAction = override.action;
            if (feedbackApplied) {
              actionSource = override.source;
            }

            explorationData = {
              modelAction: dqnAction,
              finalAction: finalAction,
              source: actionSource,
            };

            const sourceLabel =
              actionSource === "model"
                ? "🎯 MODEL"
                : actionSource === "random"
                  ? "🎲 RANDOM"
                  : "🎯 ANTI";
            console.log(
              `[MetricsCollector] ACTION SOURCE: ${sourceLabel} - Model: ${dqnAction}, Final: ${finalAction}`,
            );
            console.log(`ACTION SOURCE: ${actionSource}`);

            // � Store both model and final actions for UI + debugger
            if (typeof window !== "undefined") {
              window.__metricsCollector = window.__metricsCollector || {};
              window.__metricsCollector.currentModelAction = dqnAction;
              window.__metricsCollector.currentFinalAction = finalAction;
            }

            // �📊 Store decision source for debugger + RL analysis
            if (typeof window !== "undefined") {
              window.__metricsCollector = window.__metricsCollector || {};
              window.__metricsCollector.lastDecisionInfo = {
                modelProb: 0.25,
                randomProb: 0.55,
                antiProb: 0.2,
                source: actionSource, // "model" | "random" | "anti-model" | "feedback-repeat" | "feedback-reverse" | "idle"
                dqnAction: dqnAction,
                finalAction: finalAction,
                timestamp: Date.now(),
                feedbackGiven: false,
              };
            }
          } else {
            // Model action invalid, use noop
            finalAction = 0;
            actionSource = "fallback";
            console.log(
              `[MetricsCollector] DQN returned invalid action, using noop`,
            );

            // Apply feedback override if active (one-time effect per action)
            const override = applyFeedbackOverride(finalAction, 0.4);
            finalAction = override.action;
            actionSource = override.source;

            // � Store both model and final actions for UI + debugger
            if (typeof window !== "undefined") {
              window.__metricsCollector = window.__metricsCollector || {};
              window.__metricsCollector.currentModelAction = dqnAction;
              window.__metricsCollector.currentFinalAction = finalAction;
            }

            // �📊 Store decision source for debugger + RL analysis
            if (typeof window !== "undefined") {
              window.__metricsCollector = window.__metricsCollector || {};
              window.__metricsCollector.lastDecisionInfo = {
                modelProb: 0.3,
                randomProb: 0.5,
                antiProb: 0.2,
                source: actionSource,
                dqnAction: dqnAction,
                finalAction: finalAction,
                timestamp: Date.now(),
                feedbackGiven: false,
              };
            }
          }
        }
      } catch (error) {
        console.error("[MetricsCollector] Failed to fetch DQN action:", error);
        dqnAction = -1; // Fallback to rule-based
        finalAction = 0;
        actionSource = "error";

        // Apply feedback override if active (one-time effect per action)
        const override = applyFeedbackOverride(finalAction, 0.4);
        finalAction = override.action;
        actionSource = override.source;

        // � Store both model and final actions for UI + debugger
        if (typeof window !== "undefined") {
          window.__metricsCollector = window.__metricsCollector || {};
          window.__metricsCollector.currentModelAction = dqnAction;
          window.__metricsCollector.currentFinalAction = finalAction;
        }

        // �📊 Store decision source for debugger + RL analysis
        if (typeof window !== "undefined") {
          window.__metricsCollector = window.__metricsCollector || {};
          window.__metricsCollector.lastDecisionInfo = {
            modelProb: 0.3,
            randomProb: 0.5,
            antiProb: 0.2,
            source: actionSource,
            dqnAction: dqnAction,
            finalAction: finalAction,
            timestamp: Date.now(),
            feedbackGiven: false,
          };
        }
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
            `[MetricsCollector] COOLDOWN MASKED: DQN wanted action ${dqnAction}, but got ${finalAction} due to cooldown`,
          );
        }
      }
    }

    // Calculate elapsed time and task data
    const elapsedTime = Date.now() - this.lastCollectionTime;
    const taskData = this.currentTaskData || {};

    // ⚠️ CRITICAL: Skip reward calculations when metrics are null (unknown)
    // Idle/cooldown periods should be reward-neutral, not "perfect performance"
    const metricsAreValid =
      this.windowMetrics &&
      this.windowMetrics.misclicks !== null &&
      this.windowMetrics.mouseSpeed !== null;
    const taskReward =
      !metricsAreValid || idleGated ? 0 : this.calculateTaskReward(taskData);

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

      // Experiment mode (affects action selection strategy)
      // "model" | "guided" | "random"
      experimentMode: getExperimentMode(),

      // CRITICAL: For RL training, use finalAction (after epsilon-greedy)
      // finalAction will be applied during the NEXT window and influence the next state
      // This preserves causality: (S_t, A_t, S_{t+1}) where A_t is finalAction from THIS snapshot
      // IDLE: When idle, finalAction = 0 (noop)
      action: finalAction, // ✅ Final action chosen (after exploration)
      dqnAction: dqnAction, // Model action before exploration
      finalAction: finalAction, // Action actually applied (may differ from dqnAction)
      ruleBasedAction: this.currentAction, // Fallback action (for reference only)
      isIdleGated: idleGated, // Flag for learning to skip this transition

      // Exploration tracking for RL analysis
      actionSource: actionSource, // "model" | "explore" | "idle" | "fallback" | "error"
      explorationData: explorationData, // { modelAction, finalAction, source, epsilon, nextEpsilon }

      // Human-in-the-loop feedback (attached to this snapshot)
      // Used in RL training: final_reward = system_reward + 0.5 * feedback
      userFeedback: this.latestFeedback, // +1 (like), -1 (dislike), 0 (none)

      // CRITICAL: Masking info - which gating mechanisms applied
      // Used for RL analysis: filter/understand which transitions were gated
      maskingInfo: {
        idleGated: idleGated,
        cooldownMasked: cooldownMasked,
        metricsNull: !metricsAreValid,
        modelAction: dqnAction,
        finalAction: finalAction,
      },

      uiState: this.currentUIState || {},

      // Include task data in snapshot
      task: {
        completed: taskData.completed || false,
        elapsedTime: taskData.elapsedTime || 0,
        timeLimit: taskData.timeLimit || 0,
        pathLength: taskData.pathLength || 0,
      },

      // Include transaction status in snapshot
      transaction: {
        active: this.transactionStatus.active,
        transactionId: this.transactionStatus.transactionId,
        startTime: this.transactionStatus.startTime,
        completeReason: this.transactionStatus.completeReason,
      },

      // Transaction path type (experiment condition)
      pathType: this.pathType,

      taskReward: taskReward,

      done: false, // Will be set to true when flow completes
    };

    this.snapshots.push(snapshot);
    this.lastCollectionTime = Date.now();

    // Detect neutral feedback: if no feedback was given during this snapshot window,
    // set neutral override to boost exploration on next decision
    if (!window.__metricsCollector?.lastDecisionInfo?.feedbackGiven) {
      this.feedbackOverride = {
        active: true,
        type: "neutral",
        action: null,
      };
    }

    // Reset feedback after attaching to snapshot (one-time use)
    this.latestFeedback = 0;

    // Reset snapshot timer and prepare for next 10-second window
    if (typeof window !== "undefined") {
      window.__metricsCollector = window.__metricsCollector || {};
      window.__metricsCollector.snapshotStartTime = Date.now();
      window.__metricsCollector.timeRemaining = 10;
    }

    // Build RL transitions ONLY when we have at least 2 snapshots
    // Transition uses: state from prev snapshot, action from prev, reward from curr, next_state from curr
    if (this.snapshots.length >= 2) {
      const prev = this.snapshots[this.snapshots.length - 2];
      const curr = this.snapshots[this.snapshots.length - 1];

      const s = this.buildStateVector(prev.metrics, prev.persona, prev.uiState);
      const s_prime = this.buildStateVector(
        curr.metrics,
        curr.persona,
        curr.uiState,
      );
      if (s === null || s_prime === null) {
        console.warn(
          "[MetricsCollector] Skipping transition - invalid state vector (metrics/persona missing)",
        );
      } else {
        const r_task = curr.taskReward ?? 0;
        const r_behavior = (curr.userFeedback ?? 0) * 0.5;

        let r = r_task + r_behavior;

        // Penalize actions that saturate UI dimensions (text, spacing, button changes)
        if (curr.metrics?.uiSaturation) {
          const sat = curr.metrics.uiSaturation;
          const saturatedDims = ["text", "spacing", "button"].filter(
            (k) => sat[k] !== null && sat[k] > 0.8,
          ).length;
          r -= 0.03 * saturatedDims;
        }
        // Reward good mouse control (low speed = precise movements)
        if (
          curr.metrics?.mouseSpeed !== null &&
          curr.metrics.mouseSpeed < 0.4
        ) {
          r += 0.02;
        }
        // Penalize excessive misclicks (sign of poor adaptation)
        if (curr.metrics?.misclicks !== null && curr.metrics.misclicks > 2) {
          r -= 0.02;
        }
        // Encourage exploration by rewarding different actions
        if (prev.finalAction !== curr.finalAction) {
          r += 0.01;
        }
        r = Math.max(-1, Math.min(1, r));

        const transition = {
          s,
          a: prev.finalAction,
          r: r, // Enhanced reward
          r_task,
          r_behavior,
          s_prime,
          done: curr.done ?? false,
          actionSource: prev.actionSource,
          feedback: curr.userFeedback ?? 0,
          maskingInfo: prev.maskingInfo,
          metadata: {
            timestamp: curr.timestamp,
            sessionId: curr.sessionId,
            appId: localStorage.getItem("app_id") || "unknown", // track app session
            flowId: curr.flowId,
            stepId: curr.stepId,
            taskId: `${curr.flowId}_${curr.stepId}`,
            experimentMode: curr.experimentMode || getExperimentMode(),
            explorationData: prev.explorationData || null,
          },
        };

        // ⚠️ CRITICAL: Save with retry mechanism
        this.saveTransitionWithRetry(transition);

        // 📊 Log RL data for experiment analysis (non-blocking, async)
        // Append to memory buffer for export
        const rlLogEntry = {
          timestamp: curr.timestamp,
          persona: curr.persona?.type || curr.persona?.persona || "unknown",
          experimentMode: curr.experimentMode || getExperimentMode(),
          pathType: this.pathType,
          modelAction: prev.dqnAction ?? -1,
          finalAction: prev.finalAction ?? -1,
          source: prev.actionSource || "unknown",
          reward: r,
          taskTime: curr.task?.elapsedTime || 0,
          success: curr.task?.completed ? 1 : 0,
        };

        // Non-blocking async log append
        appendRLLog(rlLogEntry).catch((err) =>
          console.warn(
            "[MetricsCollector] RL logging failed (non-critical):",
            err.message,
          ),
        );
      }
    }

    console.log(
      `[MetricsCollector] ✓ Snapshot collected: ${this.snapshots.length} total`,
      {
        persona: this.currentPersona?.persona || this.currentPersona?.type,
        modelAction: dqnAction,
        finalAction: finalAction,
        source: actionSource,
        dbReady: this.dbReady,
        dbSaved: this.snapshots.length >= 2,
      },
    );

    return snapshot;
  }

  // Build state vector matching DQN format (returns OBJECT like snapshotToStateVector)
  buildStateVector(metrics, persona, uiState) {
    if (!metrics || !persona) return null;

    const personaType = persona.persona || persona.type || "intermediate";

    // ⚠️ Diagnostic: check if uiState is missing
    if (!uiState || Object.keys(uiState).length === 0) {
      console.warn(
        "[MetricsCollector.buildStateVector] ⚠️  uiState is missing or empty - UI variants will be 0",
      );
    }

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
      s_persona_novice_old: personaType === "novice_old" ? 1 : 0,
      s_persona_intermediate: personaType === "intermediate" ? 1 : 0,
      s_persona_expert: personaType === "expert" ? 1 : 0,
      // ✅ Add UI variants (normalized 0-1)
      s_ui_button_level: uiState
        ? Math.min((uiState.buttonSize || 0) / 6.0, 1.0)
        : 0,
      s_ui_text_level: uiState
        ? Math.min((uiState.textSize || 0) / 6.0, 1.0)
        : 0,
      s_ui_spacing_level: uiState
        ? Math.min((uiState.spacing || 0) / 6.0, 1.0)
        : 0,
      s_ui_font_level: uiState
        ? Math.min((uiState.fontWeight || 0) / 6.0, 1.0)
        : 0,
    };
  }

  // Mark flow as complete
  completeFlow() {
    if (this.snapshots.length > 0) {
      this.snapshots[this.snapshots.length - 1].done = true;
    }
  }

  // Get all collected snapshots
  getSnapshots() {
    return this.snapshots;
  }

  // Get epsilon-greedy exploration stats (epsilon, exploration rate, etc)
  getExplorerStats() {
    return this.explorer.getStats();
  }

  // Get RL logs as CSV string (experiment data export)
  getRLLogsAsCSV() {
    return exportRLLogs();
  }

  // Clear RL logs (reset for new experiment)
  clearRLLogs() {
    clearRLLogs();
    console.log("[MetricsCollector] RL logs cleared");
  }

  // Build transitions from snapshots using reward function (s_t, a_t, s_{t+1})
  buildTransitions(rewardFn) {
    return TransitionBuilder.buildTransitions(this.snapshots, rewardFn);
  }

  // Export as JSON (snapshots from current session only)
  // Includes experiment mode in metadata and each snapshot
  toJSON() {
    return {
      metadata: {
        sessionId: this.sessionId,
        flowId: this.flowId,
        createdAt: new Date().toISOString(),
        snapshotCount: this.snapshots.length,
        experimentMode: getExperimentMode(), // Current experiment mode
        explorationStats: this.getExplorerStats(),
      },
      snapshots: this.snapshots,
    };
  }

  // Export all transitions from IndexedDB as JSON
  // ⚠️ CRITICAL: This exports STORED transitions, not in-memory snapshots
  async exportStoredTransitionsAsJSON() {
    try {
      const data = await this.dbManager.exportAllAsJSON();
      console.log("[MetricsCollector] Exported stored transitions as JSON");
      return data;
    } catch (err) {
      console.error(
        "[MetricsCollector] Failed to export transitions as JSON:",
        err,
      );
      return null;
    }
  }

  // Export as CSV (requires pairing + reward function)
  // @param {Function} rewardFn - computes reward from transition
  toCSV(rewardFn) {
    const transitions = this.buildTransitions(rewardFn);
    return TransitionBuilder.toCSV(transitions);
  }

  // Export all transitions from IndexedDB as CSV
  // ⚠️ CRITICAL: This exports STORED transitions, not in-memory snapshots
  async exportStoredTransitionsAsCSV() {
    try {
      const csv = await this.dbManager.exportAllAsCSV();
      if (!csv) {
        console.warn("[MetricsCollector] No transitions to export");
        return null;
      }
      console.log("[MetricsCollector] Exported stored transitions as CSV");
      return csv;
    } catch (err) {
      console.error(
        "[MetricsCollector] Failed to export transitions as CSV:",
        err,
      );
      return null;
    }
  }

  // Validate snapshot consistency: check all fields present before training
  validate() {
    if (this.snapshots.length === 0) {
      return { valid: false, reason: "No snapshots collected" };
    }

    // Required fields in every snapshot
    const requiredFields = [
      "timestamp",
      "sessionId",
      "flowId",
      "stepId",
      "metrics",
      "persona",
      "action",
      "finalAction",
      "actionSource",
      "userFeedback",
      "taskReward",
      "maskingInfo",
      "done",
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

  // Print 10 random snapshots for debugging
  // ⚠️ CRITICAL: Run this before training to verify all fields present
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
      console.log(`  metrics: ${snap.metrics ? "✓" : "✗ MISSING"}`);
      console.log(`  persona: ${snap.persona ? "✓" : "✗ MISSING"}`);
      console.log(`  action: ${snap.action}`);
      console.log(`  finalAction: ${snap.finalAction}`);
      console.log(`  taskReward: ${snap.taskReward}`);
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
        console.log(
          `  Missing maskingInfo fields: ${validation.missingMaskingFields.join(", ")}`,
        );
      }
    }
    console.log("=".repeat(80) + "\n");
  }
  // Print collection diagnostics: check status, debug collection issues
  printCollectionDiagnostics() {
    console.log("\n" + "=".repeat(80));
    console.log("METRICS COLLECTOR DIAGNOSTICS");
    console.log("=".repeat(80));

    console.log(`\n[INITIALIZATION]`);
    console.log(`  SessionId: ${this.sessionId}`);
    console.log(`  FlowId: ${this.flowId}`);
    console.log(`  StepId: ${this.stepId}`);
    console.log(`  DB Ready: ${this.dbReady ? "✓ YES" : "✗ NO"}`);
    console.log(`  DB Manager: ${this.dbManager ? "✓ EXISTS" : "✗ MISSING"}`);

    console.log(`\n[STATE]`);
    console.log(`  Snapshots collected: ${this.snapshots.length}`);
    console.log(`  Current idle state: ${this.isIdle ? "IDLE" : "ACTIVE"}`);
    console.log(`  Latest feedback: ${this.latestFeedback}`);
    console.log(
      `  Current persona: ${this.currentPersona ? "✓ SET" : "✗ NOT SET"}`,
    );
    console.log(
      `  Current metrics: ${this.windowMetrics ? "✓ SET" : "✗ NOT SET"}`,
    );
    console.log(
      `  Current UI state: ${this.currentUIState ? "✓ SET" : "✗ NOT SET"}`,
    );

    console.log(`\n[RECENT SNAPSHOTS]`);
    if (this.snapshots.length === 0) {
      console.log(`  ✗ No snapshots collected yet`);
    } else {
      const lastSnaps = this.snapshots.slice(-3);
      lastSnaps.forEach((snap, idx) => {
        const snapIdx = this.snapshots.length - (3 - idx);
        console.log(
          `  [${snapIdx}] timestamp: ${new Date(snap.timestamp).toISOString()}`,
        );
        console.log(
          `       persona: ${snap.persona?.name || "unknown"}, action: ${snap.finalAction}, reward: ${snap.taskReward}`,
        );
        console.log(
          `       masking: idle=${snap.maskingInfo?.idleGated}, cooldown=${snap.maskingInfo?.cooldownMasked}, metricsNull=${snap.maskingInfo?.metricsNull}`,
        );
      });
    }

    console.log(`\n[TRANSITION BUILDING]`);
    if (this.snapshots.length < 2) {
      console.log(
        `  ✗ Need at least 2 snapshots to build transitions (currently ${this.snapshots.length})`,
      );
    } else {
      console.log(
        `  ✓ Can build transitions (${this.snapshots.length - 1} potential transitions)`,
      );

      // Check if state vectors are buildable
      const prev = this.snapshots[this.snapshots.length - 2];
      const curr = this.snapshots[this.snapshots.length - 1];
      const s = this.buildStateVector(prev.metrics, prev.persona, prev.uiState);
      const s_prime = this.buildStateVector(
        curr.metrics,
        curr.persona,
        curr.uiState,
      );

      if (s && s_prime) {
        console.log(
          `  ✓ Latest state vectors valid (19 features each: 12 metrics + 3 persona + 4 UI variants)`,
        );
      } else {
        console.log(`  ✗ Latest state vectors INVALID:`);
        console.log(
          `    - prev state: ${s ? "✓" : "✗ (missing metrics or persona)"}`,
        );
        console.log(
          `    - curr state: ${s_prime ? "✓" : "✗ (missing metrics or persona)"}`,
        );
      }
    }

    console.log(`\n[DATABASE]`);
    this.dbManager.printDiagnostics();
  }
}

export function computeUXMetrics(metrics) {
  const wrongClicks = metrics.wrong_clicks || 0;
  const clicks = metrics.num_clicks || 1;

  const misclick_rate = wrongClicks / clicks;

  const task_completion_time =
    Date.now() - (metrics.task_start_time || Date.now());

  const total_clicks = clicks;

  const idle_time = metrics.idle_time || 0;

  return {
    misclick_rate,
    task_completion_time,
    total_clicks,
    idle_time,
  };
}
// INTEGRATION: new MetricsCollector("session_123", "transaction", "confirm"); updateMetrics/Persona via useEffect hooks; collectSnapshot every 10s; export CSV on flow complete

export default MetricsCollector;
