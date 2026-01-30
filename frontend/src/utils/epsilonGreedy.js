/**
 * Epsilon-Greedy Exploration Strategy
 * 
 * Balances exploitation (model action) vs exploration (random action)
 * Decays epsilon over time to shift from exploration to exploitation
 */

import { ACTION_SPACE } from "../adaptation/actionSpace";

/**
 * Guided Exploration Strategy
 * 
 * Replaces epsilon-greedy with a more structured exploration approach:
 * - 40% → Model action (exploitation)
 * - 40% → Random valid action (broad exploration)
 * - 20% → Anti-model action (opposite direction, targeted exploration)
 * 
 * This prevents overuse of single actions (e.g., action 7) while maintaining
 * learning signal from model through increased base probability.
 */
export class EpsilonGreedyExplorer {
  constructor(initialEps = 0.4, minEps = 0.1, decayRate = 0.995) {
    this.eps = initialEps;
    this.epsMin = minEps;
    this.decayRate = decayRate;
    this.decisionCount = 0;
    this.modelCount = 0;
    this.randomCount = 0;
    this.antiModelCount = 0;
  }

  /**
   * Map action to its opposite direction
   * Pairs: (1,2)=up/down, (3,4)=left/right, (5,6)=zoom, (7,8)=spacing, 0=noop
   * 
   * @param {number} a - Action ID
   * @returns {number} Opposite action ID
   */
  getOppositeAction(a) {
    const map = {
      1: 2, 2: 1,  // up ↔ down
      3: 4, 4: 3,  // left ↔ right
      5: 6, 6: 5,  // zoom in ↔ zoom out
      7: 8, 8: 7,  // spacing reduce ↔ increase
    };
    return map[a] ?? 0;  // Default to noop
  }

  /**
   * Select action using guided exploration strategy
   * CRITICAL: Decay applied ONCE per decision (called every 10 seconds in collectSnapshot)
   * 
   * @param {number} modelAction - Action from DQN model
   * @param {Array} validActions - [optional] Array of valid action IDs. If not provided, uses all actions.
   * @returns {Object} { action, source, epsilon }
   *   - action: final action to use
   *   - source: "model" (40%) | "random" (40%) | "anti-model" (20%)
   *   - epsilon: current epsilon value (for logging/analysis)
   */
  selectAction(modelAction, validActions = null) {
    this.decisionCount++;

    // Get valid actions if not provided
    if (!validActions) {
      validActions = Object.keys(ACTION_SPACE)
        .map((k) => parseInt(k))
        .filter((k) => k >= 0 && k <= 9);
    }

    const p = Math.random();
    let finalAction;
    let source;

    if (p < 0.4) {
      // 40% → Model action (exploitation)
      finalAction = modelAction;
      source = "model";
      this.modelCount++;
    } else if (p < 0.8) {
      // 40% → Random valid action (broad exploration)
      finalAction = validActions[Math.floor(Math.random() * validActions.length)];
      source = "random";
      this.randomCount++;
    } else {
      // 20% → Anti-model action (targeted exploration)
      finalAction = this.getOppositeAction(modelAction);
      source = "anti-model";
      this.antiModelCount++;
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
   * Get current epsilon value
   * @returns {number} epsilon value (0-1)
   */
  getEpsilon() {
    return this.eps;
  }

  /**
   * Get current stats
   * @returns {Object} guided exploration statistics
   */
  getStats() {
    return {
      decisionCount: this.decisionCount,
      modelCount: this.modelCount,
      randomCount: this.randomCount,
      antiModelCount: this.antiModelCount,
      modelRate:
        this.decisionCount > 0
          ? (this.modelCount / this.decisionCount * 100).toFixed(1) + "%"
          : "0%",
      randomRate:
        this.decisionCount > 0
          ? (this.randomCount / this.decisionCount * 100).toFixed(1) + "%"
          : "0%",
      antiModelRate:
        this.decisionCount > 0
          ? (this.antiModelCount / this.decisionCount * 100).toFixed(1) + "%"
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
    this.modelCount = 0;
    this.randomCount = 0;
    this.antiModelCount = 0;
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
