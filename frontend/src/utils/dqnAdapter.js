// DQN Adapter: call ML backend to get optimal action from state vector; cache predictions for 500ms

import { ACTION_SPACE } from "../adaptation/actionSpace";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const CACHE_DURATION = 500; // Cache DQN predictions for 500ms to avoid too many requests

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

// Convert action ID to action name
export function actionIdToName(actionId) {
  return Object.values(ACTION_SPACE).find((name, id) => id === actionId) || null;
}
