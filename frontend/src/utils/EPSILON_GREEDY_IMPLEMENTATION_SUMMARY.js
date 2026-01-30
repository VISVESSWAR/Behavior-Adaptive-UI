/**
 * EPSILON-GREEDY EXPLORATION - IMPLEMENTATION SUMMARY
 * 
 * Balances exploitation (DQN model) vs exploration (random actions)
 * Enables diverse RL training data while gradually improving policies
 */

/**
 * FILES CREATED
 * =============
 */

// 1. frontend/src/utils/epsilonGreedy.js (NEW)
//    - EpsilonGreedyExplorer class
//    - Methods: selectAction(), randomAction(), getStats(), reset()
//    - Handles epsilon decay and exploration tracking
//
// 2. frontend/src/utils/EPSILON_GREEDY_GUIDE.js (NEW)
//    - Comprehensive integration guide
//    - Parameter explanations
//    - Snapshot field definitions
//    - Training data filtering examples
//    - Customization guide
//
// 3. frontend/src/utils/EPSILON_GREEDY_CODE_EXAMPLES.js (NEW)
//    - 12 practical code examples
//    - Real-world usage patterns
//    - Monitoring and debugging examples
//    - Analysis patterns

/**
 * FILES MODIFIED
 * ==============
 */

// 1. frontend/src/utils/metricsCollectorSimplified.js
//    - Import EpsilonGreedyExplorer
//    - Create this.explorer in constructor
//    - Apply epsilon-greedy in collectSnapshot()
//    - Track actionSource and explorationData
//    - Add getExplorerStats() method
//    - Include exploration stats in toJSON() metadata

/**
 * HOW IT WORKS
 * ============
 */

// Timeline (every 10-second decision cycle):
//
// 1. DQN model predicts action: action = 3 (text_up)
// 2. Random number generated: rand = 0.25
// 3. Check epsilon condition: rand < eps (0.25 < 0.40)? YES
// 4. Explore: random action selected (e.g., 7 = spacing_up)
// 5. Final action set to 7
// 6. actionSource set to "explore"
// 7. Epsilon decayed: eps = 0.40 * 0.995 = 0.398
// 8. Snapshot saved with action=7, dqnAction=3, actionSource="explore"
// 9. Console log: "🎲 EXPLORE - Model: 3, Final: 7, Epsilon: 0.400"

/**
 * KEY PARAMETERS
 * ==============
 */

// Initial epsilon: eps = 0.4 (40% exploration initially)
// Minimum epsilon: epsMin = 0.1 (always explore 10%)
// Decay rate: epsDecay = 0.995 (reduce by 0.5% per cycle)
//
// Convergence time:
//   N ≈ ln(epsMin/eps) / ln(epsDecay) ≈ 276 cycles
//   276 cycles × 10 seconds/cycle ≈ 46 minutes to reach epsMin

/**
 * SNAPSHOT FIELDS FOR RL ANALYSIS
 * ================================
 */

snapshot = {
  // Action selection results
  action: 7,                    // Final action used (from epsilon-greedy)
  dqnAction: 3,                 // Model action before exploration
  finalAction: 7,               // Same as action (for clarity)
  
  // Exploration tracking
  actionSource: "explore",      // Source: "model" | "explore" | "idle" | "fallback"
  explorationData: {            // Detailed exploration info
    modelAction: 3,
    finalAction: 7,
    source: "explore",
    epsilon: 0.4000,            // Epsilon for this decision
    nextEpsilon: 0.3980,        // Epsilon for next decision
  },
  
  // Existing fields unchanged
  isIdleGated: false,
  taskReward: 0.5,
  // ... other fields ...
};

/**
 * CONSOLE LOGGING
 * ===============
 */

// Exploitation (60% of time initially):
"[MetricsCollector] 🎯 EXPLOIT - Model: 3, Final: 3, Epsilon: 0.400"

// Exploration (40% of time initially):
"[MetricsCollector] 🎲 EXPLORE - Model: 3, Final: 7, Epsilon: 0.400"

// Snapshot summary:
"[MetricsCollector] Snapshot collected: 42 total"
"  persona: novice_old"
"  modelAction: 3"
"  finalAction: 7"
"  source: explore"

/**
 * GETTING EXPLORATION STATISTICS
 * ===============================
 */

const collector = window.__metricsCollector;
const stats = collector.getExplorerStats();

console.log(stats);
// Output:
// {
//   decisionCount: 42,
//   explorationCount: 15,
//   exploitationCount: 27,
//   explorationRate: "35.7%",
//   currentEpsilon: "0.3800",
//   minEpsilon: 0.1,
//   decayRate: 0.995
// }

/**
 * FILTERING TRAINING DATA BY EXPLORATION SOURCE
 * ==============================================
 */

const allSnapshots = collector.getSnapshots();

// Filter by source for different training strategies:

// 1. All actions
const allTransitions = buildTransitions(allSnapshots);

// 2. Only model-driven (imitation learning)
const modelSnapshots = allSnapshots.filter(s => s.actionSource === "model");
const modelTransitions = buildTransitions(modelSnapshots);

// 3. Only exploration (discovery learning)
const exploreSnapshots = allSnapshots.filter(s => s.actionSource === "explore");
const exploreTransitions = buildTransitions(exploreSnapshots);

// 4. Valid only (exclude idle/error)
const validSnapshots = allSnapshots.filter(
  s => !["idle", "fallback", "error"].includes(s.actionSource)
);
const validTransitions = buildTransitions(validSnapshots);

/**
 * CONSOLE MESSAGES
 * ================
 */

// Standard exploration:
"[MetricsCollector] 🎲 EXPLORE - Model: 3, Final: 7, Epsilon: 0.400"

// Standard exploitation:
"[MetricsCollector] 🎯 EXPLOIT - Model: 3, Final: 3, Epsilon: 0.400"

// When idle:
"[MetricsCollector] IDLE - Using noop action (0), DQN inference paused"

// When model action invalid:
"[MetricsCollector] DQN returned invalid action, using noop"

// Snapshot collection:
"[MetricsCollector] Snapshot collected: 50 total"
"  persona: novice_old, modelAction: 3, finalAction: 7, source: explore"

/**
 * BENEFITS
 * ========
 */

// 1. DIVERSE TRAINING DATA
//    - Exploration generates diverse state-action pairs
//    - Prevents overfitting to specific sequences
//    - Improves generalization

// 2. MODE COLLAPSE PREVENTION
//    - Random actions prevent agent from getting stuck on one action
//    - Explores alternative paths through state space
//    - Discovers new reward signals

// 3. BOOTSTRAPPING
//    - Early exploration helps discover good regions of state space
//    - Later exploitation refines within those regions
//    - Natural curriculum for learning

// 4. RL ANALYSIS
//    - actionSource field enables source attribution
//    - Separate analysis of exploration vs exploitation
//    - Understand which random actions led to success

// 5. ROBUSTNESS
//    - Training on both model and random actions
//    - Makes agent robust to unexpected inputs
//    - Better performance in diverse user scenarios

/**
 * CUSTOMIZATION
 * ==============
 */

// Edit frontend/src/utils/metricsCollectorSimplified.js constructor:
//
// Change exploration parameters:
// this.explorer = new EpsilonGreedyExplorer(
//   0.5,     // Higher initial epsilon = more exploration
//   0.05,    // Lower min epsilon = less exploration at end
//   0.99     // Lower decay rate = faster shift to exploitation
// );

/**
 * DECAY RATE COMPARISON
 * =====================
 */

// Fast decay (decayRate=0.98):
//   Reaches epsMin in ~138 cycles (~23 minutes)
//   Quick shift to exploitation
//
// Balanced (decayRate=0.995):  // CURRENT
//   Reaches epsMin in ~276 cycles (~46 minutes)
//   Gradual shift to exploitation
//
// Slow decay (decayRate=0.99):
//   Reaches epsMin in ~552 cycles (~92 minutes)
//   Extended exploration phase

/**
 * VERIFICATION CHECKLIST
 * ======================
 */

// ✓ Verify exploration is working:
//   Watch console for "🎯 EXPLOIT" and "🎲 EXPLORE" messages
//   Both should appear with appropriate frequency
//
// ✓ Verify epsilon is decaying:
//   Check console logs over time
//   Epsilon should gradually decrease
//   Explore messages should become less frequent
//
// ✓ Verify snapshots contain exploration data:
//   const snapshots = collector.getSnapshots();
//   Check that snapshots have actionSource and explorationData fields
//
// ✓ Verify stats are available:
//   const stats = collector.getExplorerStats();
//   Should return object with decisionCount, explorationRate, etc.
//
// ✓ Verify exported data includes exploration:
//   const json = collector.toJSON();
//   Should include explorationStats in metadata

/**
 * DEBUGGING TIPS
 * ==============
 */

// Problem: Only seeing "🎯 EXPLOIT"
// → Check that epsilon is > 0.1
// → Check that Math.random() calls are actually probabilistic
//
// Problem: Exploration actions not varying
// → Check randomAction() implementation
// → Verify ACTION_SPACE has all 10 actions
//
// Problem: actionSource undefined in snapshots
// → Check that collectSnapshot() is being called
// → Verify MetricsCollector is initialized correctly
//
// Problem: Epsilon not decaying
// → Check that tick() is called each decision cycle
// → Verify decay calculation: eps = Math.max(epsMin, eps * epsDecay)

export { };
