/**
 * Epsilon-Greedy Exploration Strategy
 * 
 * Balances exploitation (model action) vs exploration (random action)
 * Decays epsilon over time to shift from exploration to exploitation
 */

import { ACTION_SPACE } from "../adaptation/actionSpace";

/**
 * Epsilon-Greedy Explorer
 * Wraps model action selection with exploration strategy
 */
export class EpsilonGreedyExplorer {
  constructor(initialEps = 0.4, minEps = 0.1, decayRate = 0.995) {
    this.eps = initialEps;
    this.epsMin = minEps;
    this.decayRate = decayRate;
    this.decisionCount = 0;
    this.explorationCount = 0;
    this.exploitationCount = 0;
  }

  /**
   * Select action using epsilon-greedy strategy
   * CRITICAL: Decay applied ONCE per decision (called every 10 seconds in collectSnapshot)
   * 
   * @param {number} modelAction - Action from DQN model
   * @returns {Object} { action, source, epsilon }
   *   - action: final action to use
   *   - source: "model" (exploitation) or "explore" (exploration)
   *   - epsilon: current epsilon value before decay
   */
  selectAction(modelAction) {
    this.decisionCount++;

    const rand = Math.random();
    let finalAction = modelAction;
    let source = "model";

    if (rand < this.eps) {
      // Explore: select random action
      finalAction = this.randomAction();
      source = "explore";
      this.explorationCount++;
    } else {
      // Exploit: use model action
      this.exploitationCount++;
    }

    // Decay epsilon for next decision
    // CRITICAL: Decay happens ONCE per selectAction call (= once per 10-second snapshot collection cycle)
    const oldEps = this.eps;
    this.eps = Math.max(this.epsMin, this.eps * this.decayRate);

    return {
      action: finalAction,
      source,
      epsilon: oldEps,
      nextEpsilon: this.eps,
    };
  }

  /**
   * Select random action from action space
   * Excludes -1 (invalid action) but includes all valid actions (0-9)
   * @returns {number} random action ID (0-9)
   */
  randomAction() {
    // ACTION_SPACE: { 0: "noop", 1: "button_up", ..., 9: "enable_tooltips" }
    const validActions = Object.keys(ACTION_SPACE)
      .map((k) => parseInt(k))
      .filter((k) => k >= 0 && k <= 9);

    const randomIndex = Math.floor(Math.random() * validActions.length);
    return validActions[randomIndex];
  }

  /**
   * Get current exploration rate
   * @returns {number} epsilon value (0-1)
   */
  getEpsilon() {
    return this.eps;
  }

  /**
   * Get current stats
   * @returns {Object} exploration statistics
   */
  getStats() {
    return {
      decisionCount: this.decisionCount,
      explorationCount: this.explorationCount,
      exploitationCount: this.exploitationCount,
      explorationRate:
        this.decisionCount > 0
          ? (this.explorationCount / this.decisionCount * 100).toFixed(1) + "%"
          : "0%",
      currentEpsilon: this.eps.toFixed(4),
      minEpsilon: this.epsMin,
      decayRate: this.decayRate,
    };
  }

  /**
   * Reset explorer state (for testing or new session)
   */
  reset() {
    this.decisionCount = 0;
    this.explorationCount = 0;
    this.exploitationCount = 0;
    // Don't reset eps, let decay continue
  }

  /**
   * Fully reset including epsilon
   */
  fullReset() {
    this.eps = this.eps / this.decayRate; // Restore to original
    this.reset();
  }
}

export default EpsilonGreedyExplorer;
