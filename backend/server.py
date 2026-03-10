import numpy as np
import json
import joblib
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
import logging
from pathlib import Path

app = Flask(__name__)

# -----------------------------------------------------
# LOGGING
# -----------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------------------------------
# PATHS
# -----------------------------------------------------

ADAPTIVE_MODEL_PATH = "models/adaptive_ui_policy_model_normalized_upd.pkl"
FEATURE_COLUMNS_PATH = "models/feature_columns_normalized_upd.pkl"

USABILITY_LOG = "logs/usability_metrics.json"
RL_TRANSITIONS_LOG = "logs/rl_transitions.json"

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
        "task_start_time": data.get("task_start_time"),
        "adaptive_enabled": data.get("adaptive_enabled"),
        "method_used": data.get("method_used"),
        "action": data.get("action"),
        "misclick_rate": data.get("misclick_rate"),
        "task_completion_time": data.get("task_completion_time"),
        "total_clicks": data.get("total_clicks"),
        "idle_time": data.get("idle_time")
    }

    # ⚠️ CRITICAL: Log what's being written to file
    logger.info("=" * 80)
    logger.info("💾 WRITING ENTRY TO usability_metrics.json")
    logger.info("=" * 80)
    logger.info(f"✏️  Entry being written:")
    logger.info(f"  timestamp: {entry['timestamp']}")
    logger.info(f"  user_id: {entry['user_id']}")
    logger.info(f"  session_id: {entry['session_id']}")
    logger.info(f"  task_id: {entry['task_id']}")
    logger.info(f"  action: {entry['action']}")
    logger.info(f"  ⭐ misclick_rate: {entry['misclick_rate']} (type: {type(entry['misclick_rate']).__name__})")
    logger.info(f"  ⭐ task_completion_time: {entry['task_completion_time']} (type: {type(entry['task_completion_time']).__name__})")
    logger.info(f"  ⭐ total_clicks: {entry['total_clicks']} (type: {type(entry['total_clicks']).__name__})")
    logger.info(f"  ⭐ idle_time: {entry['idle_time']} (type: {type(entry['idle_time']).__name__})")
    
    # Final validation before writing
    if entry['misclick_rate'] is None or entry['task_completion_time'] is None or entry['total_clicks'] is None or entry['idle_time'] is None:
        logger.error("🚨 ERROR: One or more UX metrics are NULL before writing to file!")
    else:
        logger.info("✅ All UX metrics are valid (non-null)")

    append_json(USABILITY_LOG, entry)

    logger.info(f"✓ Successfully logged UX metrics for user {entry['user_id']}")
    logger.info("=" * 80)

# -----------------------------------------------------
# LOG TRANSITION
# -----------------------------------------------------

def log_transition(data):

    entry = {
        "timestamp": datetime.now().isoformat(),
        "user_id": data.get("user_id"),
        "session_id": data.get("session_id"),
        "task_id": data.get("task_id"),
        "task_start_time": data.get("task_start_time"),
        "state": data.get("state"),
        "rf_action": data.get("rf_action"),
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

        logger.info("=" * 80)
        logger.info("🔵 ADAPTIVE ACTION REQUEST RECEIVED",data)
        logger.info("=" * 80)

        user_id = data.get("user_id", "anonymous")
        session_id = data.get("session_id")
        task_id = data.get("task_id")
        task_start_time = data.get("task_start_time")
        adaptive_enabled = data.get("adaptive_enabled", True)

        state = data["state"]

        logger.info(f"📍 User: {user_id}")
        logger.info(f"📊 Session: {session_id}")
        logger.info(f"📋 Task: {task_id}")
        logger.info(f"⏱️  Task Start Time: {task_start_time}")
        logger.info(f"State vector length: {len(state)}")

        # ⚠️ CRITICAL: Log incoming metrics EXACTLY AS RECEIVED
        logger.info("=" * 80)
        logger.info("📥 INCOMING USABILITY METRICS (FROM FRONTEND)")
        logger.info("=" * 80)
        misclick_rate = data.get("misclick_rate")
        task_completion_time = data.get("task_completion_time")
        total_clicks = data.get("total_clicks")
        idle_time = data.get("idle_time")
        
        logger.info(f"  misclick_rate: {misclick_rate} (type: {type(misclick_rate).__name__})")
        logger.info(f"  task_completion_time: {task_completion_time} (type: {type(task_completion_time).__name__})")
        logger.info(f"  total_clicks: {total_clicks} (type: {type(total_clicks).__name__})")
        logger.info(f"  idle_time: {idle_time} (type: {type(idle_time).__name__})")
        
        # Check if any metrics are null
        metrics_null_count = sum([
            misclick_rate is None,
            task_completion_time is None,
            total_clicks is None,
            idle_time is None
        ])
        
        if metrics_null_count > 0:
            logger.warning(f"⚠️  {metrics_null_count}/4 metrics are NULL! This indicates a frontend computation issue.")
        else:
            logger.info("✅ All 4 metrics are valid (non-null)")

        if len(state) < EXPECTED_FEATURE_COUNT:
            raise ValueError("Insufficient state features")

        state = state[:EXPECTED_FEATURE_COUNT]

        # -------------------------------------------------
        # RANDOM FOREST PREDICTION
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
        # FINAL POLICY (RF ONLY)
        # -------------------------------------------------

        action = rf_action
        method_used = "RF_POLICY"

        # -------------------------------------------------
        # LOG TRANSITION
        # -------------------------------------------------

        log_transition({
            "user_id": user_id,
            "session_id": session_id,
            "task_id": task_id,
            "task_start_time": task_start_time,
            "state": state,
            "rf_action": rf_action,
            "final_action": action,
            "method_used": method_used
        })

        # -------------------------------------------------
        # LOG USABILITY METRICS
        # -------------------------------------------------

        logger.info("=" * 80)
        logger.info("📤 LOGGING USABILITY METRICS TO usability_metrics.json")
        logger.info("=" * 80)
        
        usability_payload = {
            "user_id": user_id,
            "session_id": session_id,
            "task_id": task_id,
            "task_start_time": task_start_time,
            "adaptive_enabled": adaptive_enabled,
            "method_used": method_used,
            "action": action,
            "misclick_rate": misclick_rate,
            "task_completion_time": task_completion_time,
            "total_clicks": total_clicks,
            "idle_time": idle_time
        }
        
        logger.info(f"Payload to log: {usability_payload}")
        log_usability(usability_payload)

        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return jsonify({
            "action": action,
            "action_name": ACTION_NAMES.get(action),
            "method_used": method_used,
            "rf_action": rf_action,
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
        "rf_model_loaded": rf_model is not None
    })


# -----------------------------------------------------
# START SERVER
# -----------------------------------------------------

if __name__ == "__main__":

    app.run(port=5001, debug=True)