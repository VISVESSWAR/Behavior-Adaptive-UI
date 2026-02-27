// Epsilon-Greedy Exploration: balances exploitation vs exploration with epsilon decay

import { ACTION_SPACE } from "../adaptation/actionSpace.jsx";

// Guided Exploration: 30% model (exploit) / 50% random (explore) / 20% anti-model (targeted)
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

  // Map action to opposite direction: (1↔2, 3↔4, 5↔6, 7↔8, 0→0, 9→9)
  getOppositeAction(a) {
    const map = {
      1: 2, 2: 1,  // button_up ↔ button_down
      3: 4, 4: 3,  // text_up ↔ text_down
      5: 6, 6: 5,  // font_up ↔ font_down
      7: 8, 8: 7,  // spacing_up ↔ spacing_down
      0: 0,        // noop → noop
      9: 9,        // enable_tooltips → enable_tooltips
    };
    return map[a] ?? 0;  // Default to noop
  }

  // Select action using guided exploration strategy
  // CRITICAL: Decay applied ONCE per decision (called every 10 seconds in collectSnapshot)
  // @param {number} modelAction - Action from DQN model
  // @param {Array} validActions - [optional] Array of valid action IDs. If not provided, uses all actions.
  // @returns {Object} { action, source, epsilon }
  //   - action: final action to use
  
  //   - epsilon: current epsilon value (for logging/analysis)
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

    if (p < 0.25) {
      // 25% → Model action (exploitation)
      finalAction = modelAction;
      source = "model";
      this.modelCount++;
    } else if (p < 0.8) {
      //55% → Random valid action (broad exploration)
      finalAction = validActions[Math.floor(Math.random() * validActions.length)];
      source = "random";
      this.randomCount++;
    } else {
      // 20% → Anti-model action (targeted exploration)
      finalAction = this.getOppositeAction(modelAction);
      source = "anti-model";
      this.antiModelCount++;
    }

    
    const oldEps = this.eps;
    this.eps = Math.max(this.epsMin, this.eps * this.decayRate);

    return {
      action: finalAction,
      source,
      epsilon: oldEps,
      nextEpsilon: this.eps,
    };
  }

  // Get current epsilon value
  // @returns {number} epsilon value (0-1)
  getEpsilon() {
    return this.eps;
  }

  // Get current stats
  // @returns {Object} guided exploration statistics
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

  // Reset explorer state (for testing or new session)
  reset() {
    this.decisionCount = 0;
    this.modelCount = 0;
    this.randomCount = 0;
    this.antiModelCount = 0;
    // Don't reset eps, let decay continue
  }

  // Fully reset including epsilon
  fullReset() {
    this.eps = this.eps / this.decayRate; // Restore to original
    this.reset();
  }
}

export default EpsilonGreedyExplorer;
