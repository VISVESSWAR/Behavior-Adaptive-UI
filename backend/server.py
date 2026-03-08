import numpy as np
import torch
import json
import joblib
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
import logging
from pathlib import Path

from models.q_network import QNetwork

app = Flask(__name__)

# -----------------------------------------------------
# LOGGING
# -----------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------------------------------
# PATHS
# -----------------------------------------------------

RL_MODEL_PATH = "models/ddqn_adaptive_ui_full_checkpoint.pth"
STATE_COLS_PATH = "models/dqn_state_cols_v2.json"

ADAPTIVE_MODEL_PATH = "models/adaptive_ui_policy_model_normalized_upd.pkl"
FEATURE_COLUMNS_PATH = "models/feature_columns_normalized_upd.pkl"

USABILITY_LOG = "logs/usability_metrics.json"
RL_TRANSITIONS_LOG = "logs/rl_transitions.json"

device = torch.device("cpu")

# -----------------------------------------------------
# LOAD RL MODEL
# -----------------------------------------------------

checkpoint = torch.load(RL_MODEL_PATH, map_location=device)

STATE_SIZE = checkpoint["state_dim"]
ACTION_SIZE = checkpoint["action_dim"]

logger.info(f"RL model state size: {STATE_SIZE}")
logger.info(f"RL model action size: {ACTION_SIZE}")

rl_model = QNetwork(STATE_SIZE, ACTION_SIZE)
rl_model.load_state_dict(checkpoint["policy_state_dict"])
rl_model.eval()

logger.info("RL model loaded successfully")

# -----------------------------------------------------
# LOAD STATE COLUMN ORDER
# -----------------------------------------------------

state_cols = json.load(open(STATE_COLS_PATH))["s_cols"]

logger.info(f"Loaded state column order ({len(state_cols)} features)")

# -----------------------------------------------------
# RANDOM FOREST FEATURE SCHEMA
# -----------------------------------------------------

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

# -----------------------------------------------------
# LOAD RANDOM FOREST MODEL
# -----------------------------------------------------

try:

    rf_model = joblib.load(ADAPTIVE_MODEL_PATH)
    feature_columns = joblib.load(FEATURE_COLUMNS_PATH)

    logger.info("RandomForest model loaded")

    # Debug validation
    if hasattr(rf_model, "n_features_in_"):

        model_features = rf_model.n_features_in_

        logger.info(f"Model expects {model_features} features")

        if model_features != EXPECTED_FEATURE_COUNT:
            logger.warning(
                f"Feature count mismatch: model expects {model_features}, expected {EXPECTED_FEATURE_COUNT}"
            )

    logger.info(f"Loaded feature columns: {feature_columns}")

    if feature_columns != EXPECTED_FEATURE_COLUMNS:
        logger.warning("Feature column order mismatch detected")

except Exception as e:

    logger.error(f"RandomForest model loading failed: {e}")

    rf_model = None
    feature_columns = None

# -----------------------------------------------------
# ACTION SPACE
# -----------------------------------------------------

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

# -----------------------------------------------------
# JSON APPEND UTILITY
# -----------------------------------------------------

def append_json(file, entry):

    Path("logs").mkdir(exist_ok=True)

    if Path(file).exists():
        data = json.load(open(file))
    else:
        data = []

    data.append(entry)

    json.dump(data, open(file, "w"), indent=2)

# -----------------------------------------------------
# LOG USABILITY METRICS
# -----------------------------------------------------

def log_usability(data):

    entry = {
        "timestamp": datetime.now().isoformat(),
        "user_id": data.get("user_id"),
        "session_id": data.get("session_id"),
        "task_id": data.get("task_id"),
        "adaptive_enabled": data.get("adaptive_enabled"),
        "method_used": data.get("method_used"),
        "action": data.get("action"),
        "misclick_rate": data.get("misclick_rate"),
        "task_completion_time": data.get("task_completion_time"),
        "total_clicks": data.get("total_clicks"),
        "idle_time": data.get("idle_time")
    }

    append_json(USABILITY_LOG, entry)

    logger.info(f"Logged UX metrics for user {entry['user_id']}")

# -----------------------------------------------------
# LOG RL TRANSITION
# -----------------------------------------------------

def log_rl_transition(data):

    entry = {
        "timestamp": datetime.now().isoformat(),
        "user_id": data.get("user_id"),
        "session_id": data.get("session_id"),
        "task_id": data.get("task_id"),
        "state": data.get("state"),
        "rf_action": data.get("rf_action"),
        "rl_action": data.get("rl_action"),
        "final_action": data.get("final_action"),
        "method_used": data.get("method_used")
    }

    append_json(RL_TRANSITIONS_LOG, entry)

# -----------------------------------------------------
# ADAPTIVE ACTION ENDPOINT
# -----------------------------------------------------

@app.route("/adaptive-action", methods=["POST"])
def adaptive_action():

    try:

        data = request.json

        logger.info("Adaptive action request received")

        user_id = data.get("user_id", "anonymous")
        session_id = data.get("session_id")
        task_id = data.get("task_id")
        adaptive_enabled = data.get("adaptive_enabled", True)

        state = data["state"]

        logger.info(f"User: {user_id}")
        logger.info(f"State vector length: {len(state)}")

        if len(state) < EXPECTED_FEATURE_COUNT:
            raise ValueError("Insufficient state features")

        state = state[:EXPECTED_FEATURE_COUNT]

        # -------------------------------------------------
        # RF PREDICTION
        # -------------------------------------------------

        input_data = {
            EXPECTED_FEATURE_COLUMNS[i]: float(state[i])
            for i in range(EXPECTED_FEATURE_COUNT)
        }

        df = pd.DataFrame([input_data])

        probs = rf_model.predict_proba(df)[0]

        rf_action = int(np.argmax(probs))
        confidence = float(np.max(probs))

        # -------------------------------------------------
        # RL PREDICTION
        # -------------------------------------------------

        state_tensor = torch.tensor(np.array(state, dtype=np.float32)).unsqueeze(0)

        with torch.no_grad():
            q_values = rl_model(state_tensor)
            rl_action = int(torch.argmax(q_values).item())

        # -------------------------------------------------
        # HYBRID POLICY
        # -------------------------------------------------

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

        # -------------------------------------------------
        # LOG RL TRANSITION
        # -------------------------------------------------

        log_rl_transition({
            "user_id": user_id,
            "session_id": session_id,
            "task_id": task_id,
            "state": state,
            "rf_action": rf_action,
            "rl_action": rl_action,
            "final_action": action,
            "method_used": method_used
        })

        # -------------------------------------------------
        # LOG UX METRICS
        # -------------------------------------------------

        log_usability({
            "user_id": user_id,
            "session_id": session_id,
            "task_id": task_id,
            "adaptive_enabled": adaptive_enabled,
            "method_used": method_used,
            "action": action,
            "misclick_rate": data.get("misclick_rate"),
            "task_completion_time": data.get("task_completion_time"),
            "total_clicks": data.get("total_clicks"),
            "idle_time": data.get("idle_time")
        })

        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

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


# -----------------------------------------------------
# HEALTH CHECK
# -----------------------------------------------------

@app.route("/health")
def health():

    return jsonify({
        "status": "ok",
        "rl_model_loaded": True,
        "rf_model_loaded": rf_model is not None
    })


# -----------------------------------------------------
# START SERVER
# -----------------------------------------------------

if __name__ == "__main__":

    app.run(port=5001, debug=True)