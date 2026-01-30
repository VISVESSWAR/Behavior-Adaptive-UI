/**
 * EPSILON-GREEDY EXPLORATION - CODE EXAMPLES
 * 
 * Practical examples showing how the exploration system works
 */

/**
 * EXAMPLE 1: Basic Flow (Automatic)
 * =================================
 * 
 * Epsilon-greedy is automatic in MetricsCollector!
 * No extra code needed.
 */

// In App.js:
/*
const collector = new MetricsCollector(sessionId, flowId, stepId);

// During metrics collection (every 10s):
const snapshot = await collector.collectSnapshot();

// Snapshot automatically contains:
// - action: final action (may differ from dqnAction)
// - dqnAction: model action
// - actionSource: "model" | "explore" | "idle"
// - explorationData: { modelAction, finalAction, epsilon, ... }
*/

/**
 * EXAMPLE 2: Check Exploration Stats
 * ==================================
 */

const collector = window.__metricsCollector;
const stats = collector.getExplorerStats();

console.log(stats);
/*
Output:
{
  decisionCount: 50,
  explorationCount: 18,
  exploitationCount: 32,
  explorationRate: "36.0%",
  currentEpsilon: "0.3752",
  minEpsilon: 0.1,
  decayRate: 0.995
}
*/

// Use these for dashboard/logging:
console.log(`Epsilon-Greedy Stats:`);
console.log(`  Decisions made: ${stats.decisionCount}`);
console.log(`  Exploration rate: ${stats.explorationRate}`);
console.log(`  Current epsilon: ${stats.currentEpsilon}`);

/**
 * EXAMPLE 3: Inspect Individual Snapshots
 * ========================================
 */

const snapshots = collector.getSnapshots();
const latestSnapshot = snapshots[snapshots.length - 1];

console.log('Latest snapshot:');
console.log({
  dqnAction: latestSnapshot.dqnAction,
  finalAction: latestSnapshot.finalAction,
  actionSource: latestSnapshot.actionSource,
  explorationData: latestSnapshot.explorationData,
});

// Output example:
/*
{
  dqnAction: 3,
  finalAction: 7,
  actionSource: "explore",
  explorationData: {
    modelAction: 3,
    finalAction: 7,
    source: "explore",
    epsilon: 0.3752,
    nextEpsilon: 0.3734
  }
}
*/

/**
 * EXAMPLE 4: Filter Snapshots by Action Source
 * ============================================
 */

const snapshots = collector.getSnapshots();

// Get all exploitation actions (model-driven)
const exploitation = snapshots.filter(s => s.actionSource === "model");
console.log(`Model-driven actions: ${exploitation.length}`);

// Get all exploration actions (random)
const exploration = snapshots.filter(s => s.actionSource === "explore");
console.log(`Random exploration actions: ${exploration.length}`);

// Get all valid actions (exclude idle/error)
const valid = snapshots.filter(
  s => !["idle", "fallback", "error"].includes(s.actionSource)
);
console.log(`Valid RL training data: ${valid.length}`);

/**
 * EXAMPLE 5: Building Training Data with Source Filtering
 * ========================================================
 */

import { TransitionBuilder } from './snapshotSchema.js';

const collector = window.__metricsCollector;
const allSnapshots = collector.getSnapshots();

// Approach 1: Train on everything
const allTransitions = TransitionBuilder.buildTransitions(
  allSnapshots,
  rewardFunction
);

// Approach 2: Train only on model actions (imitation learning)
const modelSnapshots = allSnapshots.filter(s => s.actionSource === "model");
const imitationTransitions = TransitionBuilder.buildTransitions(
  modelSnapshots,
  rewardFunction
);

// Approach 3: Train only on exploration actions
const explorationSnapshots = allSnapshots.filter(s => s.actionSource === "explore");
const explorationTransitions = TransitionBuilder.buildTransitions(
  explorationSnapshots,
  rewardFunction
);

// Approach 4: Curriculum - mix changes over time
const earlySnapshots = allSnapshots.slice(0, Math.floor(allSnapshots.length * 0.5));
const lateSnapshots = allSnapshots.slice(Math.floor(allSnapshots.length * 0.5));

const earlyTransitions = TransitionBuilder.buildTransitions(earlySnapshots, rewardFunction);
const lateTransitions = TransitionBuilder.buildTransitions(lateSnapshots, rewardFunction);

console.log(`Early phase: ${earlyTransitions.length} transitions`);
console.log(`Late phase: ${lateTransitions.length} transitions`);

/**
 * EXAMPLE 6: Analyze Exploration vs Exploitation Results
 * =======================================================
 */

const snapshots = collector.getSnapshots();

// Group by action source
const grouped = {
  model: [],
  explore: [],
  idle: [],
  other: [],
};

snapshots.forEach(s => {
  if (s.actionSource === "model") grouped.model.push(s);
  else if (s.actionSource === "explore") grouped.explore.push(s);
  else if (s.actionSource === "idle") grouped.idle.push(s);
  else grouped.other.push(s);
});

// Calculate average reward by source
const avgReward = (snapshots) =>
  snapshots.length > 0
    ? snapshots.reduce((sum, s) => sum + (s.taskReward || 0), 0) / snapshots.length
    : 0;

console.log(`\nReward Analysis:`);
console.log(`  Model actions: avg reward = ${avgReward(grouped.model).toFixed(3)}`);
console.log(`  Exploration: avg reward = ${avgReward(grouped.explore).toFixed(3)}`);
console.log(`  Idle: avg reward = ${avgReward(grouped.idle).toFixed(3)}`);

/**
 * EXAMPLE 7: Monitor Epsilon Decay Over Time
 * ===========================================
 */

const collector = window.__metricsCollector;
const snapshots = collector.getSnapshots();

// Extract epsilon from each snapshot
const epsilonProgression = snapshots.map((s, i) => ({
  snapshot: i,
  epsilon: s.explorationData?.epsilon || "N/A",
  source: s.actionSource,
}));

// Show first 5
console.log('Epsilon decay progression (first 5):');
epsilonProgression.slice(0, 5).forEach(d => {
  console.log(`  Snapshot ${d.snapshot}: eps=${d.epsilon}, source=${d.source}`);
});

// Show last 5
console.log('Epsilon decay progression (last 5):');
epsilonProgression.slice(-5).forEach(d => {
  console.log(`  Snapshot ${d.snapshot}: eps=${d.epsilon}, source=${d.source}`);
});

/**
 * EXAMPLE 8: Comparison - Model vs Exploration Actions
 * =====================================================
 */

const snapshots = collector.getSnapshots();

// Find cases where exploration differed from model
const explorationDifferences = snapshots.filter(
  s => s.actionSource === "explore" && s.dqnAction !== s.finalAction
);

console.log(`Exploration actions that differed from model: ${explorationDifferences.length}`);

explorationDifferences.slice(0, 5).forEach((s, i) => {
  console.log(`
    Case ${i + 1}:
      Model suggested: ${s.dqnAction}
      Random chosen: ${s.finalAction}
      Reward: ${s.taskReward}
  `);
});

/**
 * EXAMPLE 9: Export Data with Exploration Info
 * ============================================
 */

const json = collector.toJSON();

console.log('Exported metadata with exploration stats:');
console.log(json.metadata);
/*
Output:
{
  sessionId: "session_123",
  flowId: "transaction",
  createdAt: "2026-01-30T...",
  snapshotCount: 50,
  explorationStats: {
    decisionCount: 50,
    explorationCount: 18,
    exploitationCount: 32,
    explorationRate: "36.0%",
    currentEpsilon: "0.3752",
    minEpsilon: 0.1,
    decayRate: 0.995
  }
}
*/

/**
 * EXAMPLE 10: Calculating Epsilon Manually
 * ========================================
 */

// If you want to know epsilon at a specific decision:
const decisionIndex = 100;
const initialEps = 0.4;
const decayRate = 0.995;
const minEps = 0.1;

let eps = initialEps;
for (let i = 0; i < decisionIndex; i++) {
  eps = Math.max(minEps, eps * decayRate);
}

console.log(`Epsilon after ${decisionIndex} decisions: ${eps.toFixed(4)}`);

// Or using closed form:
const epsAfterN = Math.max(
  minEps,
  initialEps * Math.pow(decayRate, decisionIndex)
);
console.log(`Epsilon (closed form): ${epsAfterN.toFixed(4)}`);

/**
 * EXAMPLE 11: Real-time Exploration Monitoring Dashboard
 * =======================================================
 */

// Update dashboard every 30 seconds
setInterval(() => {
  const collector = window.__metricsCollector;
  if (!collector) return;

  const stats = collector.getExplorerStats();
  const latestSnapshot = collector.getSnapshots().pop();

  const dashboard = {
    timestamp: new Date().toLocaleTimeString(),
    epsilon: parseFloat(stats.currentEpsilon).toFixed(3),
    explorationRate: stats.explorationRate,
    totalDecisions: stats.decisionCount,
    exploreCount: stats.explorationCount,
    lastActionSource: latestSnapshot?.actionSource,
    lastActionModel: latestSnapshot?.dqnAction,
    lastActionFinal: latestSnapshot?.finalAction,
  };

  console.table(dashboard);
}, 30000);

/**
 * EXAMPLE 12: Analysis - Which Random Actions Worked Well?
 * =========================================================
 */

const snapshots = collector.getSnapshots();
const explorationSnapshots = snapshots.filter(s => s.actionSource === "explore");

// Group by action and calculate avg reward
const rewardByAction = {};
explorationSnapshots.forEach(s => {
  const action = s.finalAction;
  if (!rewardByAction[action]) {
    rewardByAction[action] = { total: 0, count: 0 };
  }
  rewardByAction[action].total += s.taskReward || 0;
  rewardByAction[action].count += 1;
});

// Calculate averages
const actionPerformance = Object.entries(rewardByAction).map(([action, data]) => ({
  action: parseInt(action),
  avgReward: data.total / data.count,
  count: data.count,
}));

// Sort by avg reward
actionPerformance.sort((a, b) => b.avgReward - a.avgReward);

console.log('Exploration performance by action:');
actionPerformance.forEach(ap => {
  console.log(`  Action ${ap.action}: avg reward = ${ap.avgReward.toFixed(3)} (n=${ap.count})`);
});

export { };
