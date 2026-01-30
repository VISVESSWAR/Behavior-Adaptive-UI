/**
 * HUMAN-IN-THE-LOOP FEEDBACK SYSTEM - IMPLEMENTATION GUIDE
 *
 * Enables users to provide real-time feedback (Like/Dislike) on UI adaptations.
 * Feedback is logged as events and attached to RL training transitions.
 */

/**
 * ============================================================================
 * OVERVIEW
 * ============================================================================
 *
 * System Components:
 *
 * 1. UI Layer (AdaptationDebugger.js)
 *    - Like/Dislike buttons for user interaction
 *    - Visual feedback (highlight button on click)
 *    - Event logging via logEvent()
 *
 * 2. Collection Layer (metricsCollectorSimplified.js)
 *    - Tracks latest feedback value (0 = none, +1 = like, -1 = dislike)
 *    - Attaches to next snapshot
 *    - Resets after each snapshot (one-time use)
 *
 * 3. Training Layer
 *    - Feedback converted to reward adjustment: 0.5 * feedback
 *    - Combined with system reward: final = system + 0.5 * feedback
 *    - Used in DQN training
 *
 * Data Flow:
 *   User clicks Like/Dislike
 *   ↓
 *   logEvent({ type: "user_feedback", value: ±1 })
 *   ↓
 *   metricsCollector.setLatestFeedback(±1)
 *   ↓
 *   Next snapshot includes userFeedback field
 *   ↓
 *   Training applies reward adjustment
 */

/**
 * ============================================================================
 * IMPLEMENTATION DETAILS
 * ============================================================================
 */

// 1. BUTTON UI (frontend/src/components/AdaptationDebugger.js)

/*

export function AdaptationDebugger() {
  const [lastFeedback, setLastFeedback] = useState(null);
  const [feedbackCount, setFeedbackCount] = useState({ like: 0, dislike: 0 });

  const handleLike = () => {
    logEvent({
      type: "user_feedback",
      value: +1,
      timestamp: Date.now(),
    });
    setLastFeedback("like");
    setFeedbackCount((prev) => ({ ...prev, like: prev.like + 1 }));

    if (window.__metricsCollector) {
      window.__metricsCollector.setLatestFeedback(+1);
      console.log("[AdaptationDebugger] 👍 Like feedback recorded");
    }

    setTimeout(() => setLastFeedback(null), 1000);
  };

  const handleDislike = () => {
    logEvent({
      type: "user_feedback",
      value: -1,
      timestamp: Date.now(),
    });
    setLastFeedback("dislike");
    setFeedbackCount((prev) => ({ ...prev, dislike: prev.dislike + 1 }));

    if (window.__metricsCollector) {
      window.__metricsCollector.setLatestFeedback(-1);
      console.log("[AdaptationDebugger] 👎 Dislike feedback recorded");
    }

    setTimeout(() => setLastFeedback(null), 1000);
  };

  return (
    <div className="...">
      {/* ... existing debug UI ... */}

      {/* Feedback buttons */}
      <div className="mt-3 border-t border-gray-500 pt-2">
        <div className="font-semibold mb-2 text-xs">💬 Feedback:</div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleLike}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              lastFeedback === "like"
                ? "bg-green-500 text-black scale-110"
                : "bg-gray-700 hover:bg-green-600 text-white"
            }`}
          >
            👍 Like ({feedbackCount.like})
          </button>
          <button
            onClick={handleDislike}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              lastFeedback === "dislike"
                ? "bg-red-500 text-black scale-110"
                : "bg-gray-700 hover:bg-red-600 text-white"
            }`}
          >
            👎 Dislike ({feedbackCount.dislike})
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          Attached to next transition for RL training
        </div>
      </div>
    </div>
  );
}

*/

// 2. EVENT LOGGING (src/logging/eventLogger.js - already supports this)

/*

logEvent({
  type: "user_feedback",    // Event type
  value: +1,                 // +1 for Like, -1 for Dislike
  timestamp: Date.now(),     // When the feedback was given
})

// Later, retrieve all feedback events:
const logs = getLogs();
const feedbackEvents = logs.filter(e => e.type === "user_feedback");

*/

// 3. METRICS COLLECTION (frontend/src/utils/metricsCollectorSimplified.js)

/*

class MetricsCollector {
  constructor(sessionId, flowId, stepId) {
    this.latestFeedback = 0; // Current feedback value
    // ... rest of init
  }

  setLatestFeedback(feedback) {
    this.latestFeedback = feedback;
  }

  async collectSnapshot() {
    // ... compute action, metrics, etc ...

    const snapshot = {
      // ... existing fields ...
      
      // Human feedback attached HERE
      userFeedback: this.latestFeedback, // +1, -1, or 0
      
      // ... rest of snapshot
    };

    this.snapshots.push(snapshot);
    this.latestFeedback = 0; // Reset for next snapshot
    
    return snapshot;
  }
}

*/

/**
 * ============================================================================
 * DATA SCHEMA
 * ============================================================================
 */

/*

Event (logged to eventLogger):
{
  ts: number,                    // Timestamp (auto-added)
  type: "user_feedback",         // Event type
  value: 1 | -1,                 // +1 (like) or -1 (dislike)
  timestamp: number              // Duplicate for reference
}

Snapshot (in metricsCollectorSimplified):
{
  // ... existing fields ...
  userFeedback: 1 | -1 | 0,      // Latest feedback value (0 = none)
  // ... rest
}

Training Transition (after conversion):
{
  s_t: [...],                    // State vector
  a_t: number,                   // Action
  r_t: number,                   // Reward (shaped: system + 0.5 * feedback)
  s_t1: [...],                   // Next state
  done: boolean,

  // Optional metadata:
  userFeedback: 1 | -1 | 0,      // Original feedback from snapshot
  baseReward: number,            // System reward before shaping
}

*/

/**
 * ============================================================================
 * FEEDBACK INTEGRATION IN RL TRAINING
 * ============================================================================
 */

/*

// In your training script:

import { shapeReward } from './rewardShaping.js';

function buildTrainingTransition(snapshot_t, snapshot_t1, baseReward) {
  // Apply reward shaping INCLUDING feedback
  const { final: shapedReward } = shapeReward(
    snapshot_t,
    baseReward,
    UI_LIMITS
  );

  return {
    s_t: snapshot_to_state_vector(snapshot_t),
    a_t: snapshot_t.action,
    r_t: shapedReward,  // Includes 0.5 * snapshot_t.userFeedback
    s_t1: snapshot_to_state_vector(snapshot_t1),
    done: snapshot_t1.done,

    // For analysis:
    metadata: {
      userFeedback: snapshot_t.userFeedback,
      baseReward: baseReward,
      feedbackBonus: 0.5 * snapshot_t.userFeedback,
    }
  };
}

// Example calculation:
// baseReward = 0.3 (system computed reward)
// userFeedback = +1 (user clicked Like)
// feedbackBonus = 0.5 * 1 = +0.5
// shapedReward = 0.3 + 0.5 = 0.8

// Example 2:
// baseReward = -0.2 (negative system reward)
// userFeedback = +1 (user still clicked Like despite poor adaptation)
// feedbackBonus = 0.5 * 1 = +0.5
// shapedReward = -0.2 + 0.5 = 0.3 (user feedback overrides system negativity)

*/

/**
 * ============================================================================
 * FEEDBACK STATISTICS & ANALYSIS
 * ============================================================================
 */

/*

// Count feedback distribution
const snapshots = collector.getSnapshots();
let feedbackStats = { like: 0, dislike: 0, none: 0 };

snapshots.forEach(snap => {
  if (snap.userFeedback === 1) feedbackStats.like++;
  else if (snap.userFeedback === -1) feedbackStats.dislike++;
  else feedbackStats.none++;
});

console.log('Feedback Distribution:', feedbackStats);
// Expected output: { like: 15, dislike: 3, none: 82 } (out of 100)


// Analyze average reward impact of feedback
const likeSnapshots = snapshots.filter(s => s.userFeedback === 1);
const avgLikeBonus = likeSnapshots.reduce((sum, s) => sum + (0.5 * s.userFeedback), 0) / likeSnapshots.length;

console.log('Average Like bonus:', avgLikeBonus);
// Output: 0.5


// Find moments where user disagreed with system reward
const disagreements = snapshots.filter(snap => {
  const baseReward = computeReward(snap, nextSnap);
  const feedback = snap.userFeedback || 0;
  return (baseReward > 0 && feedback < 0) || (baseReward < 0 && feedback > 0);
});

console.log(`User disagreed with system ${disagreements.length} times`);

*/

/**
 * ============================================================================
 * FEEDBACK QUALITY CHECKS
 * ============================================================================
 */

/*

// 1. Feedback Latency
// Check if feedback is applied within 10 seconds (one snapshot window)
const feedbackLogs = getLogs().filter(e => e.type === "user_feedback");
const snapshots = collector.getSnapshots();

feedbackLogs.forEach(log => {
  const nearestSnapshot = snapshots.reduce((nearest, snap) => {
    const distCurrent = Math.abs(snap.timestamp - log.ts);
    const distNearest = Math.abs(nearest.timestamp - log.ts);
    return distCurrent < distNearest ? snap : nearest;
  });

  console.log(`Feedback at ${log.ts} attached to snapshot ${nearestSnapshot.timestamp} (latency: ${Math.abs(nearestSnapshot.timestamp - log.ts)}ms)`);
});

// 2. Feedback Consistency
// Track if user repeatedly likes/dislikes similar adaptations
const likePatterns = {};
feedbackLogs.filter(e => e.value === 1).forEach(log => {
  const snap = snapshots.find(s => Math.abs(s.timestamp - log.ts) < 5000);
  if (snap) {
    const pattern = `action_${snap.action}_persona_${snap.persona.type}`;
    likePatterns[pattern] = (likePatterns[pattern] || 0) + 1;
  }
});

console.log('Like patterns:', likePatterns);
// If user consistently likes/dislikes specific actions, DQN can learn this

// 3. Feedback Frequency
const sessiosWithFeedback = feedbackLogs.length;
const totalSnapshots = snapshots.length;
const feedbackRate = (sessiosWithFeedback / totalSnapshots * 100).toFixed(1);
console.log(`Feedback rate: ${feedbackRate}% (${sessiosWithFeedback} out of ${totalSnapshots})`);

*/

/**
 * ============================================================================
 * CURRICULUM LEARNING WITH FEEDBACK
 * ============================================================================
 */

/*

// Prioritize transitions with user feedback for early learning
const transitions = buildTransitions(snapshots);

// Phase 1: Learn from explicit positive feedback
const positiveFeedbackTransitions = transitions.filter(
  t => t.userFeedback === 1
);
await dqnModel.train(positiveFeedbackTransitions);

// Phase 2: Learn from all feedback (positive + negative)
const feedbackTransitions = transitions.filter(
  t => t.userFeedback !== 0
);
await dqnModel.train(feedbackTransitions);

// Phase 3: Learn from entire dataset including system rewards
await dqnModel.train(transitions);

// This approach prioritizes human judgment early, then scales to full dataset

*/

/**
 * ============================================================================
 * MONITORING & DEBUGGING
 * ============================================================================
 */

// Console output examples:
/*

[AdaptationDebugger] 👍 Like feedback recorded
[MetricsCollector] Snapshot collected: 45 total
[RewardShaping] 👍 Like feedback bonus: +0.5
[RewardShaping] Base: 0.300 | Saturation: 0.000 | Down: 0.000 | Feedback: 0.500 | Final: 0.800

[AdaptationDebugger] 👎 Dislike feedback recorded
[RewardShaping] 👎 Dislike feedback penalty: -0.5
[RewardShaping] Base: 0.200 | Saturation: 0.000 | Down: 0.000 | Feedback: -0.500 | Final: -0.300

*/

/**
 * ============================================================================
 * BEST PRACTICES
 * ============================================================================
 */

/*

1. FEEDBACK PLACEMENT
   - Position Like/Dislike buttons prominently in debug panel
   - Keep feedback UI minimal (don't distract from main task)
   - Use clear visual feedback (color change, scale animation)

2. FEEDBACK TIMING
   - Feedback applies to NEXT snapshot (10-second window)
   - One feedback per snapshot (system resets after attach)
   - User can provide rapid feedback, but it affects subsequent 10s window

3. FEEDBACK WEIGHTING
   - Standard: 0.5 * feedback (Like +0.5, Dislike -0.5)
   - Adjust multiplier if feedback too influential or ignored
   - Consider feedback quality (user expertise, attention level)

4. FEEDBACK COLLECTION
   - Log all feedback events to eventLogger
   - Attach to snapshots for RL training
   - Preserve original logs for audit trail

5. FEEDBACK ANALYSIS
   - Track like/dislike ratios over time
   - Identify patterns (which actions/personas get more feedback)
   - Measure feedback-reward agreement/disagreement
   - Monitor feedback latency (ensure timely attachment)

6. FEEDBACK TRAINING
   - Prioritize transitions with explicit feedback
   - Use curriculum learning (positive feedback first)
   - Balance human judgment with system rewards
   - Regularly evaluate DQN performance improvement from feedback

*/

export {};
