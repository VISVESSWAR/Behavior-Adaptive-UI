import numpy as np
import torch
import json
import joblib
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from pathlib import Path

from models.q_network import QNetwork

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ---------------- LOGGING ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- PATHS ----------------
RL_MODEL_PATH = "models/ddqn_adaptive_ui_full_checkpoint.pth"
ADAPTIVE_MODEL_PATH = "models/adaptive_ui_policy_model_normalized_upd.pkl"

USABILITY_METRICS_LOG = "logs/usability_metrics.json"
RL_TRANSITIONS_LOG = "logs/rl_transitions.json"

device = torch.device("cpu")

# ======================================================
# LOAD RL MODEL
# ======================================================

checkpoint = torch.load(RL_MODEL_PATH, map_location=device)

STATE_SIZE = checkpoint["state_dim"]
ACTION_SIZE = checkpoint["action_dim"]

model = QNetwork(STATE_SIZE, ACTION_SIZE)
model.load_state_dict(checkpoint["policy_state_dict"])
model.eval()

logger.info("✅ RL model loaded")

# ======================================================
# RANDOM FOREST MODEL
# ======================================================

EXPECTED_FEATURE_COLUMNS = [
    "s_session_duration",
    "s_total_distance",
    "s_num_actions",
    "s_num_clicks",
    "s_mean_time_per_action",
    "s_vel_mean",
    "s_vel_std",
    "s_accel_mean",
    "s_accel_std",
    "s_curve_mean",
    "s_curve_std",
    "s_jerk_mean",
    "s_persona_novice_old",
    "s_persona_intermediate",
    "s_persona_expert"
]

EXPECTED_FEATURE_COUNT = len(EXPECTED_FEATURE_COLUMNS)

adaptive_model = joblib.load(ADAPTIVE_MODEL_PATH)

logger.info("✅ RandomForest model loaded")

# ======================================================
# ACTION NAMES
# ======================================================

ACTION_NAMES = {
    0: "noop",
    1: "button_up",
    2: "button_down",
    3: "text_up",
    4: "text_down",
    5: "font_up",
    6: "font_down",
    7: "spacing_up",
    8: "spacing_down",
    9: "enable_tooltips"
}

# ======================================================
# LOGGING FUNCTIONS
# ======================================================

def log_usability_metrics(metrics):

    try:

        Path("logs").mkdir(parents=True, exist_ok=True)

        entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": metrics.get("user_id"),
            "method_used": metrics.get("method_used"),
            "action": metrics.get("action"),
            "misclick_rate": metrics.get("misclick_rate"),
            "task_completion_time": metrics.get("task_completion_time"),
            "total_clicks": metrics.get("total_clicks"),
            "idle_time": metrics.get("idle_time")
        }

        if Path(USABILITY_METRICS_LOG).exists():
            logs = json.load(open(USABILITY_METRICS_LOG))
        else:
            logs = []

        logs.append(entry)

        json.dump(logs, open(USABILITY_METRICS_LOG, "w"), indent=2)

        logger.info(f"📊 Usability metrics logged for user {entry['user_id']}")

    except Exception as e:
        logger.error(f"Usability logging failed: {e}")


def log_rl_transition(data):

    try:

        Path("logs").mkdir(parents=True, exist_ok=True)

        entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": data["user_id"],
            "state": data["state"],
            "rf_action": data["rf_action"],
            "rl_action": data["rl_action"],
            "final_action": data["final_action"],
            "method_used": data["method_used"]
        }

        if Path(RL_TRANSITIONS_LOG).exists():
            logs = json.load(open(RL_TRANSITIONS_LOG))
        else:
            logs = []

        logs.append(entry)

        json.dump(logs, open(RL_TRANSITIONS_LOG, "w"), indent=2)

        logger.info(f"🧠 RL transition logged for user {entry['user_id']}")

    except Exception as e:
        logger.error(f"RL transition logging failed: {e}")

# ======================================================
# ADAPTIVE UI ENDPOINT
# ======================================================

@app.route("/adaptive-action", methods=["POST"])
def adaptive_action():

    try:

        logger.info("\n================ Adaptive Action Request ================")

        data = request.json

        state = data["state"]
        user_id = data.get("user_id", "anonymous")

        logger.info(f"User ID: {user_id}")
        logger.info(f"Incoming state length: {len(state)}")

        if len(state) < EXPECTED_FEATURE_COUNT:
            raise ValueError(
                f"Expected at least {EXPECTED_FEATURE_COUNT} features but received {len(state)}"
            )

        # Separate state handling: RF uses truncated state (15), RL uses full state (19)
        state_for_rf = state[:EXPECTED_FEATURE_COUNT]
        state_for_rl = state[:STATE_SIZE] if len(state) >= STATE_SIZE else state

        logger.info(f"STATE_SIZE: {STATE_SIZE}, EXPECTED_FEATURE_COUNT: {EXPECTED_FEATURE_COUNT}")
        logger.info(f"Original state length: {len(state)}")
        logger.info(f"RF state length: {len(state_for_rf)}, RL state length: {len(state_for_rl)}")
        logger.info(f"RL state first 5: {state_for_rl[:5]}")

        # ======================================================
        # CREATE DATAFRAME FOR RF
        # ======================================================

        input_data = {
            EXPECTED_FEATURE_COLUMNS[i]: float(state_for_rf[i])
            for i in range(EXPECTED_FEATURE_COUNT)
        }

        df = pd.DataFrame([input_data])
        df = df[EXPECTED_FEATURE_COLUMNS]

        logger.info("Running RandomForest prediction...")

        probs = adaptive_model.predict_proba(df)[0]

        rf_action = int(np.argmax(probs))
        confidence = float(np.max(probs))

        logger.info(f"RF action: {rf_action}")
        logger.info(f"RF confidence: {confidence}")

        # ======================================================
        # RL PREDICTION
        # ======================================================

        state_tensor = torch.tensor(np.array(state_for_rl, dtype=np.float32)).unsqueeze(0)

        with torch.no_grad():
            q_values = model(state_tensor)
            rl_action = int(torch.argmax(q_values, dim=1).item())

        logger.info(f"RL action: {rl_action}")

        # ======================================================
        # HYBRID DECISION
        # ======================================================

        epsilon = 0.2

        rand = np.random.random()

        if rand < epsilon:

            action = np.random.randint(0, ACTION_SIZE)
            method_used = "EXPLORATION"

        elif confidence < 0.4:

            action = rl_action
            method_used = "RL_POLICY"

        else:

            action = rf_action
            method_used = "RF_POLICY"

        logger.info(f"Final action: {action} using {method_used}")

        # ======================================================
        # LOG RL TRANSITION
        # ======================================================

        log_rl_transition({
            "user_id": user_id,
            "state": state_for_rl,  # Use full state for RL training consistency
            "rf_action": rf_action,
            "rl_action": rl_action,
            "final_action": action,
            "method_used": method_used
        })

        # ======================================================
        # RESPONSE
        # ======================================================

        return jsonify({
            "action": action,
            "action_name": ACTION_NAMES.get(action),
            "method_used": method_used,
            "rf_action": rf_action,
            "rl_action": rl_action,
            "confidence": confidence
        })

    except Exception as e:

        logger.error(f"Adaptive action error: {e}")

        return jsonify({
            "error": str(e),
            "action": 0
        }), 500


# ======================================================
# HEALTH CHECK
# ======================================================

@app.route("/health")
def health():

    return jsonify({
        "status": "ok",
        "rl_model_loaded": True,
        "rf_model_loaded": True
    })


# ======================================================
# START SERVER
# ======================================================

if __name__ == "__main__":
    app.run(port=5001, debug=True)