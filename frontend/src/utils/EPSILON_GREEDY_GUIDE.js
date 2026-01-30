/**
 * EPSILON-GREEDY EXPLORATION - Integration Guide
 * 
 * Balances exploitation (model action) vs exploration (random action)
 * Gradually shifts from exploration to exploitation as epsilon decays
 */

/**
 * OVERVIEW
 * ========
 * 
 * The epsilon-greedy strategy enables the agent to:
 * 1. Exploit: Use the DQN model's best action (eps probability = 1-eps)
 * 2. Explore: Select random actions for discovery (eps probability = eps)
 * 3. Decay: Gradually reduce exploration as training progresses
 * 
 * Timeline:
 *   Decision 1: eps=0.40 (40% explore, 60% exploit)
 *   Decision 2: eps=0.40 * 0.995 = 0.398
 *   Decision 3: eps=0.398 * 0.995 = 0.396
 *   ...
 *   Decision N: eps ≈ 0.10 (10% explore, 90% exploit) after many cycles
 */

/**
 * FILES INVOLVED
 * ==============
 */

// 1. frontend/src/utils/epsilonGreedy.js (NEW)
//    - EpsilonGreedyExplorer class
//    - selectAction(modelAction) → { action, source, epsilon }
//    - randomAction() → random valid action (0-9)
//    - getStats() → exploration statistics
//
// 2. frontend/src/utils/metricsCollectorSimplified.js (UPDATED)
//    - Import EpsilonGreedyExplorer
//    - Create this.explorer in constructor
//    - Apply epsilon-greedy in collectSnapshot()
//    - Track actionSource and explorationData in snapshot
//    - Log exploration events to console
//    - Export getExplorerStats() method

/**
 * PARAMETERS
 * ==========
 */

// Initial epsilon: 0.4 (40% exploration initially)
let eps = 0.4;

// Minimum epsilon: 0.1 (always explore 10% of time)
const epsMin = 0.1;

// Decay rate: 0.995 (reduce by 0.5% each decision cycle)
const epsDecay = 0.995;

// After N decision cycles: eps ≈ epsMin
// N ≈ log(epsMin / eps) / log(epsDecay)
// N ≈ log(0.1 / 0.4) / log(0.995) ≈ 276 cycles
// 276 cycles × 10 seconds = ~46 minutes to reach epsMin

/**
 * DECISION FLOW
 * =============
 */

// 1. DQN model action received: action = 3 (text_up)
//    ↓
// 2. Generate random number: rand = 0.25
//    ↓
// 3. Check: Is rand < eps? (0.25 < 0.4)? YES
//    ↓
// 4. Explore: Select random action (e.g., 7 = spacing_up)
//    ↓
// 5. Set source = "explore"
//    ↓
// 6. Decay epsilon: eps = 0.4 * 0.995 = 0.398
//    ↓
// 7. Log: "[MetricsCollector] 🎲 EXPLORE - Model: 3, Final: 7, Epsilon: 0.400"
//    ↓
// 8. Add to snapshot:
//    - action: 7
//    - dqnAction: 3
//    - actionSource: "explore"
//    - explorationData: { modelAction: 3, finalAction: 7, ... }

/**
 * SNAPSHOT FIELDS FOR RL ANALYSIS
 * ================================
 */

const snapshot = {
  // ... standard fields ...
  
  // Action fields
  action: 7,                    // Final action used (after epsilon-greedy)
  dqnAction: 3,                 // Model action before exploration
  finalAction: 7,               // Same as action (for clarity)
  actionSource: "explore",      // "model" | "explore" | "idle" | "fallback" | "error"
  
  // Exploration tracking
  explorationData: {
    modelAction: 3,             // What the model recommended
    finalAction: 7,             // What was actually used
    source: "explore",          // Which strategy was used
    epsilon: 0.400,             // Epsilon value for this decision
    nextEpsilon: 0.3980,        // Epsilon for next decision
  },
  
  // ... other fields ...
};

/**
 * LOGGING MESSAGES
 * ================
 */

// Exploitation:
// "[MetricsCollector] 🎯 EXPLOIT - Model: 3, Final: 3, Epsilon: 0.400"

// Exploration:
// "[MetricsCollector] 🎲 EXPLORE - Model: 3, Final: 7, Epsilon: 0.400"

// Idle state:
// "[MetricsCollector] IDLE - Using noop action (0), DQN inference paused"

// Error:
// "[MetricsCollector] DQN returned invalid action, using noop"

/**
 * GETTING EXPLORATION STATS
 * ==========================
 */

// In code:
const stats = collector.getExplorerStats();
console.log(stats);
/*
Output:
{
  decisionCount: 42,
  explorationCount: 15,
  exploitationCount: 27,
  explorationRate: "35.7%",
  currentEpsilon: "0.3800",
  minEpsilon: 0.1,
  decayRate: 0.995
}
*/

// In exported JSON:
const json = collector.toJSON();
console.log(json.metadata.explorationStats);
// Same as above

/**
 * FILTERING TRANSITIONS FOR TRAINING
 * ===================================
 */

// When building training data, you can filter by source:

const allSnapshots = collector.getSnapshots();

// Option 1: Include all actions
const allTransitions = TransitionBuilder.buildTransitions(allSnapshots, rewardFn);

// Option 2: Only exploitation (model-driven learning)
const exploitationSnapshots = allSnapshots.filter(s => s.actionSource === "model");
const exploitationTransitions = TransitionBuilder.buildTransitions(exploitationSnapshots, rewardFn);

// Option 3: Only exploration (discovery data)
const explorationSnapshots = allSnapshots.filter(s => s.actionSource === "explore");
const explorationTransitions = TransitionBuilder.buildTransitions(explorationSnapshots, rewardFn);

// Option 4: Exclude idle/error states
const validSnapshots = allSnapshots.filter(
  s => !["idle", "fallback", "error"].includes(s.actionSource)
);
const validTransitions = TransitionBuilder.buildTransitions(validSnapshots, rewardFn);

/**
 * RL TRAINING IMPLICATIONS
 * ========================
 */

// The actionSource field enables several analyses:
//
// 1. BEHAVIOR CLONING
//    - Use only "model" actions
//    - Teaches agent to imitate DQN policy
//
// 2. EXPLORATION ANALYSIS
//    - Use "explore" actions
//    - See which random actions led to good outcomes
//    - Update model to favor those actions
//
// 3. ROBUSTNESS
//    - Train on mixture of model + explore actions
//    - Makes agent robust to diverse inputs
//    - Better generalization
//
// 4. CURRICULUM
//    - Early training: focus on exploration data
//    - Late training: focus on exploitation data
//    - Bootstrap with diverse experience, then refine

/**
 * CUSTOMIZATION
 * ==============
 */

// To change exploration parameters, edit:
// frontend/src/utils/metricsCollectorSimplified.js
//
// In constructor:
//   this.explorer = new EpsilonGreedyExplorer(
//     0.4,    // initialEps (change this)
//     0.1,    // minEps (change this)
//     0.995   // decayRate (change this)
//   );
//
// Higher initialEps = more exploration initially
// Higher minEps = more exploration even at end
// Higher decayRate = slower decay (stay exploratory longer)
// Lower decayRate = faster decay (shift to exploitation quickly)

/**
 * EXAMPLE: DECAY CURVES
 * =====================
 */

// Slow decay (decayRate=0.99):
// eps(0) = 0.40
// eps(100) = 0.20
// eps(200) = 0.10
// Stays exploratory longer

// Fast decay (decayRate=0.98):
// eps(0) = 0.40
// eps(50) = 0.20
// eps(100) = 0.10
// Shifts to exploitation quickly

// Current (decayRate=0.995):
// eps(0) = 0.40
// eps(138) = 0.20
// eps(276) = 0.10
// Balanced approach

/**
 * DEBUGGING
 * =========
 */

// Check current epsilon in console:
const collector = window.__metricsCollector;
const stats = collector.getExplorerStats();
console.log(`Current epsilon: ${stats.currentEpsilon}`);
console.log(`Exploration rate: ${stats.explorationRate}`);

// Watch exploration decisions:
// Look for these patterns in console:
// "🎯 EXPLOIT" = model action used
// "🎲 EXPLORE" = random action used

// Compare model vs final action:
const snapshot = collector.getSnapshots()[0];
console.log(`Model action: ${snapshot.dqnAction}`);
console.log(`Final action: ${snapshot.finalAction}`);
console.log(`Source: ${snapshot.actionSource}`);
console.log(`Epsilon: ${snapshot.explorationData.epsilon}`);

/**
 * TESTING
 * =======
 */

// Manually trigger exploration:
//
// 1. Set high epsilon temporarily:
//    explorer.eps = 0.9;
//    
// 2. Trigger snapshot collection
//
// 3. Should see mostly 🎲 EXPLORE logs
//
// 4. Reset epsilon:
//    explorer.eps = 0.1;
//
// 5. Trigger again
//
// 6. Should see mostly 🎯 EXPLOIT logs

export { };
