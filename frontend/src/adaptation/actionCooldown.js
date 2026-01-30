/**
 * Action Cooldown System
 * 
 * Prevents repeated consecutive "up" actions (e.g., text_up, text_up, text_up...)
 * Ensures diversity in UI adaptation by cooldown-blocking recently-used actions
 * 
 * After an UP action is used: set cooldown to 3 decision cycles
 * Each decision cycle: reduce all cooldowns by 1 until 0
 * When selecting action: block actions with cooldown > 0
 */

import { ACTION_SPACE, ACTION_ID_MAP } from "./actionSpace";

/**
 * Manages cooldowns for all "up" actions to ensure diversity
 * Prevents rapid repeated increases in UI dimensions
 */
export class ActionCooldownManager {
  constructor() {
    // Track cooldown state for each UP action
    // DOWN actions and noop are not cooldown-gated (they reduce UI)
    this.cooldowns = {
      button_up: 0,    // action ID: 1
      text_up: 0,      // action ID: 3
      font_up: 0,      // action ID: 5
      spacing_up: 0,   // action ID: 7
    };

    // For logging/debugging
    this.lastAppliedAction = null;
    this.cycleCount = 0;
  }

  /**
   * Apply cooldown to an action after it's used
   * Called after action is actually applied to UI
   * @param {number|string} actionId - The action that was applied
   */
  applyCooldown(actionId) {
    const actionName = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];

    // Only cool down UP actions to prevent rapid repeats
    if (actionName in this.cooldowns) {
      this.cooldowns[actionName] = 3; // Cooldown for 3 decision cycles
      this.lastAppliedAction = actionName;
      console.log(`[ActionCooldown] Applied cooldown to ${actionName} (will block for 3 cycles)`);
    }
  }

  /**
   * Decrement all cooldowns by 1 (called once per decision cycle)
   * Typical usage: every 10 seconds in snapshot collection
   */
  tick() {
    this.cycleCount++;

    let anyActive = false;
    for (const action of Object.keys(this.cooldowns)) {
      if (this.cooldowns[action] > 0) {
        this.cooldowns[action]--;
        anyActive = true;
      }
    }

    if (anyActive) {
      console.log(`[ActionCooldown] Cycle ${this.cycleCount}: ${JSON.stringify(this.cooldowns)}`);
    }
  }

  /**
   * Check if an action is currently in cooldown
   * @param {number|string} actionId - Action to check
   * @returns {boolean} true if action is blocked by cooldown
   */
  isOnCooldown(actionId) {
    const actionName = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];
    return this.cooldowns[actionName] > 0;
  }

  /**
   * Get remaining cooldown cycles for an action
   * @param {number|string} actionId - Action to check
   * @returns {number} remaining cycles (0 if not on cooldown)
   */
  getRemainingCooldown(actionId) {
    const actionName = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];
    return this.cooldowns[actionName] || 0;
  }

  /**
   * Filter action list to remove cooldown-blocked actions
   * If all actions are blocked, returns noop (action 0)
   * @param {number[]} actionList - List of action IDs to filter
   * @returns {number[]} filtered actions with cooldown-blocked ones removed
   */
  filterBlockedActions(actionList) {
    const filtered = actionList.filter((actionId) => !this.isOnCooldown(actionId));

    if (filtered.length === 0) {
      console.log(
        `[ActionCooldown] All proposed actions on cooldown, returning noop`,
      );
      return [0]; // Return noop action
    }

    if (filtered.length < actionList.length) {
      const blockedCount = actionList.length - filtered.length;
      console.log(
        `[ActionCooldown] Blocked ${blockedCount} action(s) due to cooldown`,
      );
    }

    return filtered;
  }

  /**
   * Get current state as object (for debugging/logging)
   */
  getState() {
    return {
      cooldowns: { ...this.cooldowns },
      cycleCount: this.cycleCount,
      lastAppliedAction: this.lastAppliedAction,
      activeCount: Object.values(this.cooldowns).filter((c) => c > 0).length,
    };
  }

  /**
   * Reset all cooldowns (for testing or flow restart)
   */
  reset() {
    for (const action of Object.keys(this.cooldowns)) {
      this.cooldowns[action] = 0;
    }
    this.cycleCount = 0;
    this.lastAppliedAction = null;
    console.log(`[ActionCooldown] Reset all cooldowns`);
  }
}

/**
 * Helper: Check if an action is an "up" action (increases UI)
 * @param {number|string} actionId - Action to check
 * @returns {boolean}
 */
export function isUpAction(actionId) {
  const name = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];
  return ["button_up", "text_up", "font_up", "spacing_up"].includes(name);
}

/**
 * Helper: Check if an action is a "down" action (decreases UI)
 * @param {number|string} actionId - Action to check
 * @returns {boolean}
 */
export function isDownAction(actionId) {
  const name = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];
  return ["button_down", "text_down", "font_down", "spacing_down"].includes(name);
}

export default ActionCooldownManager;
