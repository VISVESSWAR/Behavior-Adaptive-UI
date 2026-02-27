// Action Cooldown: prevents repeated "up" actions for 3 cycles; ensures UI adaptation diversity

import { ACTION_SPACE, ACTION_ID_MAP } from "./actionSpace.jsx";

// Track cooldowns for each "up" action to ensure diversity in UI adaptation
export class ActionCooldownManager {
  constructor() {
    // Cooldown state for UP actions; DOWN actions and noop not cooldown-gated
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

  // Apply 3-cycle cooldown after action is used
  applyCooldown(actionId) {
    const actionName = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];

    // Only cool down UP actions to prevent rapid repeats
    if (actionName in this.cooldowns) {
      this.cooldowns[actionName] = 3; // Cooldown for 3 decision cycles
      this.lastAppliedAction = actionName;
      console.log(`[ActionCooldown] Applied cooldown to ${actionName} (will block for 3 cycles)`);
    }
  }

  // Decrement all cooldowns by 1 per decision cycle (called every 10 seconds)
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

  // Check if action is on cooldown
  isOnCooldown(actionId) {
    const actionName = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];
    return this.cooldowns[actionName] > 0;
  }

  // Get remaining cooldown cycles for action (0 if not on cooldown)
  getRemainingCooldown(actionId) {
    const actionName = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];
    return this.cooldowns[actionName] || 0;
  }

  // Filter action list: remove cooldown-blocked actions; return noop if all blocked
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

  // Get current state as object (for debugging/logging)
  getState() {
    return {
      cooldowns: { ...this.cooldowns },
      cycleCount: this.cycleCount,
      lastAppliedAction: this.lastAppliedAction,
      activeCount: Object.values(this.cooldowns).filter((c) => c > 0).length,
    };
  }

  // Reset all cooldowns (for testing or flow restart)
  reset() {
    for (const action of Object.keys(this.cooldowns)) {
      this.cooldowns[action] = 0;
    }
    this.cycleCount = 0;
    this.lastAppliedAction = null;
    console.log(`[ActionCooldown] Reset all cooldowns`);
  }
}

// Check if action is an "up" action (increases UI dimensions)
export function isUpAction(actionId) {
  const name = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];
  return ["button_up", "text_up", "font_up", "spacing_up"].includes(name);
}

// Check if action is a "down" action (decreases UI dimensions)
export function isDownAction(actionId) {
  const name = typeof actionId === "string" ? actionId : ACTION_SPACE[actionId];
  return ["button_down", "text_down", "font_down", "spacing_down"].includes(name);
}

export default ActionCooldownManager;
