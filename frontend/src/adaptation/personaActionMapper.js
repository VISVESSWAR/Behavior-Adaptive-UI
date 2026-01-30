/**
 * Maps persona types to UI adaptation actions
 * Persona classification → Action selection logic
 * Also applies metric-specific adaptations (simulated RL rules)
 * Includes action cooldown system to prevent repeated UP actions
 */

import { ACTION_SPACE } from "./actionSpace";
import { ActionCooldownManager } from "./actionCooldown";

// Global cooldown manager instance
const cooldownManager = new ActionCooldownManager();

/**
 * Get recommended actions based on persona type + metrics
 * WITH COOLDOWN FILTERING to prevent rapid repeated actions
 * 
 * @param {string} persona - "novice_old", "intermediate", "expert"
 * @param {object} metrics - adapted metrics {vel_mean, idle, hesitation, misclicks}
 * @param {ActionCooldownManager} cooldown - optional cooldown manager (uses global if not provided)
 * @returns {number[]} array of action IDs to apply (filtered by cooldown)
 */
export function getActionsForPersona(persona, metrics = null, cooldown = null) {
  const cm = cooldown || cooldownManager;
  const actions = [];

  // === METRIC-SPECIFIC RULES (Simulated RL model) ===
  // These rules simulate what an RL/DQN model would learn
  if (metrics) {
    // Rule 1: High misclicks => increase button size for easier clicking
    if (metrics.misclicks > 0.4) {
      actions.push(ACTION_SPACE[1]); // button_up
      console.log(
        `[RL Simulation] High misclicks (${(metrics.misclicks * 100).toFixed(0)}%) => button_up`,
      );
    }

    // Rule 2: Long idle time => increase text size (help with vision)
    if (metrics.idle > 0.8) {
      actions.push(ACTION_SPACE[3]); // text_up
      console.log(
        `[RL Simulation] High idle time (${(metrics.idle * 100).toFixed(0)}%) => text_up`,
      );
    }

    // Rule 3: High hesitation => increase spacing for clarity
    if (metrics.hesitation > 0.3) {
      actions.push(ACTION_SPACE[7]); // spacing_up
      console.log(
        `[RL Simulation] High hesitation (${(metrics.hesitation * 100).toFixed(0)}%) => spacing_up`,
      );
    }

    // Rule 4: Low velocity (slow movements) => enable tooltips for guidance
    if (metrics.vel_mean < 0.3) {
      actions.push(ACTION_SPACE[9]); // enable_tooltips
      console.log(
        `[RL Simulation] Low velocity (${(metrics.vel_mean * 100).toFixed(0)}%) => enable_tooltips`,
      );
    }

    // If metric-based actions were applied, filter by cooldown and return
    if (actions.length > 0) {
      return cm.filterBlockedActions(actions);
    }
  }

  // === PERSONA-BASED FALLBACK (if no metric rules triggered) ===
  const personaActions = {
    novice_old: [
      ACTION_SPACE[1], // button_up (make buttons bigger)
      ACTION_SPACE[3], // text_up (increase text size)
      ACTION_SPACE[7], // spacing_up (more padding)
      ACTION_SPACE[9], // enable_tooltips (help with navigation)
    ],

    expert: [
      ACTION_SPACE[2], // button_down (compact buttons)
      ACTION_SPACE[4], // text_down (smaller text)
      ACTION_SPACE[8], // spacing_down (minimal padding)
      // no tooltips for experts
    ],

    intermediate: [ACTION_SPACE[0]], // noop
  };

  const selectedActions = personaActions[persona] || personaActions.intermediate;
  
  // Apply cooldown filtering to persona-based actions too
  return cm.filterBlockedActions(selectedActions);
}

/**
 * Get personalized action history for a user
 * @param {string} persona - Current persona
 * @param {object} history - Previous adaptation actions
 * @param {ActionCooldownManager} cooldown - optional cooldown manager
 * @returns {number[]} filtered actions to apply
 */
export function getContextualActions(persona, history = {}, cooldown = null) {
  const baseActions = getActionsForPersona(persona, null, cooldown);

  // TODO: Enhance with learning from user interaction patterns
  // For now, return base actions for persona (already cooldown-filtered)
  return baseActions;
}

/**
 * Get the global cooldown manager instance
 * @returns {ActionCooldownManager}
 */
export function getCooldownManager() {
  return cooldownManager;
}
