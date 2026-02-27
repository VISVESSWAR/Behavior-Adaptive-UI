// DQN Adapter: call ML backend to get optimal action from state vector; cache predictions for 500ms

import { ACTION_SPACE } from "../adaptation/actionSpace.jsx";

const API_BASE =  "http://localhost:5000";
const CACHE_DURATION = 500; // Cache DQN predictions for 500ms to avoid too many requests

// ============================================================
// EXPERIMENT MODE: Controls RL decision strategy
// ============================================================
// "model"  : Use model action directly (exploitation only)
// "random" : Use random valid actions (exploration only)
// "guided" : Use probabilistic mix (25% model, 55% random, 20% anti-model)
export const EXPERIMENT_MODE = "guided"; // Change to "model" or "random" for different policies

let lastPredictionTime = 0;
let lastAction = -1;

// Convert metrics to normalized DQN state vector (19 elements)
// Features 1-12: mouse behavior metrics
// Features 13-15: persona one-hot encoding
// Features 16-19: normalized UI levels (button, text, spacing, font)
export function metricsToStateVector(metrics, persona, uiState) {
  if (!metrics || !persona) return null;

  // Normalize metrics to 0-1 scale
  const stateVector = [
    // 1-12: Mouse behavior metrics
    Math.min(metrics.s_session_duration / 300, 1.0),           // 0: session_duration (max 5 mins)
    Math.min(metrics.s_total_distance / 20000, 1.0),           // 1: total_distance (max 20k px)
    Math.min(metrics.s_num_actions / 500, 1.0),                // 2: num_actions (max 500)
    Math.min(metrics.s_num_clicks / 100, 1.0),                 // 3: num_clicks (max 100)
    Math.min(metrics.s_mean_time_per_action / 3, 1.0),         // 4: mean_time_per_action (max 3s)
    Math.min(metrics.s_vel_mean / 2000, 1.0),                  // 5: vel_mean (max 2000 px/s)
    Math.min(metrics.s_vel_std / 1500, 1.0),                   // 6: vel_std (max 1500)
    Math.min(Math.abs(metrics.s_accel_mean) / 1000, 1.0),      // 7: accel_mean (max 1000, absolute)
    Math.min(metrics.s_accel_std / 10000, 1.0),                // 8: accel_std (max 10k)
    Math.min(metrics.s_curve_mean / 0.5, 1.0),                 // 9: curve_mean (max 0.5)
    Math.min(metrics.s_curve_std / 0.5, 1.0),                  // 10: curve_std (max 0.5)
    Math.min(Math.abs(metrics.s_jerk_mean) / 1000, 1.0),       // 11: jerk_mean (max 1000, absolute)
    // 13-15: Persona one-hot encoding
    persona.type === "novice_old" || persona.persona === "novice_old" ? 1.0 : 0.0,   // 12: persona_novice_old
    persona.type === "intermediate" || persona.persona === "intermediate" ? 1.0 : 0.0, // 13: persona_intermediate
    persona.type === "expert" || persona.persona === "expert" ? 1.0 : 0.0,             // 14: persona_expert
    // 16-19: Normalized UI levels (0-6 range normalized to 0-1)
    uiState ? (uiState.buttonSize || 0) / 6.0 : 0.0,            // 15: button_level
    uiState ? (uiState.textSize || 0) / 6.0 : 0.0,              // 16: text_level
    uiState ? (uiState.spacing || 0) / 6.0 : 0.0,               // 17: spacing_level
    uiState ? (uiState.fontWeight || 0) / 6.0 : 0.0,            // 18: font_level
  ];

  console.log("RL STATE LENGTH:", stateVector.length);

  return stateVector;
}

// Fetch action from DQN model backend
export async function getDQNAction(stateVector) {
  if (!stateVector) return -1;

  // Rate-limit DQN calls to avoid API flooding
  const now = Date.now();
  if (now - lastPredictionTime < CACHE_DURATION) {
    return lastAction;
  }

  try {
    const response = await fetch(`${API_BASE}/api/adaptive-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: stateVector }),
    });

    if (!response.ok) {
      console.warn("[DQN] Backend error:", response.status);
      return -1;
    }

    const data = await response.json();
    lastPredictionTime = now;
    lastAction = data.action ?? -1;

    console.log("[DQN] Predicted action:", lastAction, "state_vector:", stateVector);
    return lastAction;
  } catch (error) {
    console.error("[DQN] Request failed:", error.message);
    return -1;
  }
}

// ============================================================
// DECIDE FINAL ACTION: Apply experiment mode strategy
// ============================================================
// Implements 3 different exploration strategies:
// 1. MODEL mode: Use model action (pure exploitation)
// 2. RANDOM mode: Use random valid action (pure exploration)
// 3. GUIDED mode: Probabilistic mix (25% model, 55% random, 20% anti)
export function decideFinalAction(modelAction, validActions = null) {
  // Default valid actions: all 10 possible actions
  const actions = validActions || Array.from({ length: 10 }, (_, i) => i);
  
  console.log("MODE:", EXPERIMENT_MODE);
  
  let finalAction = modelAction;
  let source = "default";

  if (EXPERIMENT_MODE === "model") {
    // Pure exploitation: use model action directly
    finalAction = modelAction;
    source = "model";
    console.log(`[DecideFinalAction] MODEL mode: using modelAction=${modelAction}`);
  } 
  else if (EXPERIMENT_MODE === "random") {
    // Pure exploration: use random valid action
    finalAction = actions[Math.floor(Math.random() * actions.length)];
    source = "random";
    console.log(`[DecideFinalAction] RANDOM mode: selected random action=${finalAction}`);
  }
  else if (EXPERIMENT_MODE === "guided") {
    // Probabilistic mix: 25% model, 55% random, 20% anti-model
    const rand = Math.random();
    
    if (rand < 0.25) {
      // 25%: Use model action
      finalAction = modelAction;
      source = "model";
      console.log(`[DecideFinalAction] GUIDED mode: 25% model action=${finalAction}`);
    }
    else if (rand < 0.80) {
      // 55%: Use random action (0.25 to 0.80)
      finalAction = actions[Math.floor(Math.random() * actions.length)];
      source = "random";
      console.log(`[DecideFinalAction] GUIDED mode: 55% random action=${finalAction}`);
    }
    else {
      // 20%: Use anti-model (opposite if possible, else random)
      const antiModel = getAntiModel(modelAction, actions);
      finalAction = antiModel;
      source = "anti-model";
      console.log(`[DecideFinalAction] GUIDED mode: 20% anti-model action=${finalAction}`);
    }
  }
  
  return { finalAction, source };
}

// Get opposite/anti action for exploration targeting weaknesses
function getAntiModel(modelAction, validActions) {
  // Action opposites (defined by UI adaptation design)
  const oppositeMap = {
    0: 0,        // noop → noop (no opposite)
    1: 2, 2: 1,  // button_up ↔ button_down
    3: 4, 4: 3,  // text_up ↔ text_down
    5: 6, 6: 5,  // font_up ↔ font_down
    7: 8, 8: 7,  // spacing_up ↔ spacing_down
    9: 9,        // enable_tooltips (no opposite)
  };

  const opposite = oppositeMap[modelAction];
  if (opposite !== undefined && validActions.includes(opposite)) {
    return opposite;
  }

  // Fallback to random if no valid opposite
  return validActions[Math.floor(Math.random() * validActions.length)];
}
