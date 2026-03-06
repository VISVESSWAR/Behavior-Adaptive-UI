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

# ---------------- LOGGING ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- PATHS ----------------
MODEL_PATH = "models/ddqn_adaptive_ui_full_checkpoint.pth"
STATE_COLS_PATH = "models/dqn_state_cols_v2.json"
# //C:\Users\amvis\Documents\bda\copyforzip\copyforzip\backend\models\adaptive_ui_policy_model2.pkl
ADAPTIVE_MODEL_PATH = "models/adaptive_ui_policy_model_normalized_upd.pkl"
FEATURE_COLUMNS_PATH = "models/feature_columns_normalized_upd.pkl"

USABILITY_METRICS_LOG = "logs/usability_metrics.json"

device = torch.device("cpu")

# ---------------- LOAD RL MODEL ----------------
checkpoint = torch.load(MODEL_PATH, map_location=device)

STATE_SIZE = checkpoint["state_dim"]
ACTION_SIZE = checkpoint["action_dim"]

print("State dim:", STATE_SIZE)
print("Action dim:", ACTION_SIZE)

model = QNetwork(STATE_SIZE, ACTION_SIZE)
model.load_state_dict(checkpoint["policy_state_dict"])
model.eval()

print("✅ RL Policy network loaded")

# --------------- LOAD STATE ORDER ----------------
state_cols = json.load(open(STATE_COLS_PATH))["s_cols"]

# ================ EXPECTED RANDOMFOREST SCHEMA ================
# The model was trained with exactly 15 features in this order:
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

# ================ LOAD RANDOM FOREST MODEL ================
try:
    adaptive_model = joblib.load(ADAPTIVE_MODEL_PATH)
    feature_columns = joblib.load(FEATURE_COLUMNS_PATH)

    # --------- VALIDATE MODEL SCHEMA ---------
    if hasattr(adaptive_model, 'n_features_in_'):
        model_num_features = adaptive_model.n_features_in_
        logger.info(f"\n{'='*60}")
        logger.info(f"RANDOMFOREST MODEL VALIDATION")
        logger.info(f"Model n_features_in_: {model_num_features}")
        logger.info(f"Expected feature count: {EXPECTED_FEATURE_COUNT}")
        
        if model_num_features != EXPECTED_FEATURE_COUNT:
            logger.warning(
                f"⚠️ SCHEMA MISMATCH: Model expects {model_num_features} features, "
                f"but expected schema has {EXPECTED_FEATURE_COUNT} features!"
            )
        else:
            logger.info(f"✅ Feature count matches: {model_num_features}")
        
        logger.info(f"Loaded feature columns: {feature_columns}")
        logger.info(f"Expected feature columns: {EXPECTED_FEATURE_COLUMNS}")
        
        if feature_columns != EXPECTED_FEATURE_COLUMNS:
            logger.warning(f"⚠️ COLUMN ORDER MISMATCH!")
            for i, (loaded, expected) in enumerate(zip(feature_columns, EXPECTED_FEATURE_COLUMNS)):
                match_str = "✓" if loaded == expected else "✗"
                logger.warning(f"  {match_str} Position {i}: loaded='{loaded}', expected='{expected}'")
        else:
            logger.info(f"✅ Feature column order matches!")
        
        logger.info(f"{'='*60}\n")
    
    print("✅ Adaptive UI RandomForest model loaded")

except Exception as e:
    print(f"⚠️ Adaptive UI model not found: {e}")
    logger.error(f"Failed to load adaptive model: {e}")
    adaptive_model = None
    feature_columns = None

# ---------------- ACTION NAMES ----------------
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

# ================ FEATURE MAPPING ================
# UI metric → Model feature
FEATURE_MAPPING = {
    "s_session_duration": "session_duration",
    "s_total_distance": "total_distance",
    "s_num_actions": "num_actions",
    "s_num_clicks": "num_clicks",
    "s_mean_time_per_action": "mean_time_per_action",
    "s_vel_mean": "vel_mean",
    "s_vel_std": "vel_std",
    "s_accel_mean": "accel_mean",
    "s_accel_std": "accel_std",
    "s_curve_mean": "curve_mean",
    "s_curve_std": "curve_std",
    "s_jerk_mean": "jerk_mean",
    "s_persona_novice_old": "persona_novice_old",
    "s_persona_intermediate": "persona_intermediate",
    "s_persona_expert": "persona_expert"
}

# ---------------- LOGGING UTILITIES ----------------
def log_usability_metrics(metrics_dict):

    try:

        Path("logs").mkdir(parents=True, exist_ok=True)

        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "misclick_rate": metrics_dict.get("misclick_rate"),
            "task_completion_time": metrics_dict.get("task_completion_time"),
            "total_clicks": metrics_dict.get("total_clicks"),
            "idle_time": metrics_dict.get("idle_time")
        }

        if Path(USABILITY_METRICS_LOG).exists():
            with open(USABILITY_METRICS_LOG, "r") as f:
                logs = json.load(f)
        else:
            logs = []

        logs.append(log_entry)

        with open(USABILITY_METRICS_LOG, "w") as f:
            json.dump(logs, f, indent=2)

        logger.info(f"Logged usability metrics: {log_entry}")

    except Exception as e:
        logger.error(f"Error logging usability metrics: {e}")


# ======================================================
# RL MODEL ENDPOINT
# ======================================================

@app.route("/predict-action", methods=["POST"])
def predict_action():

    try:

        data = request.json

        state = np.array(data["state"], dtype=np.float32)

        if len(state) != STATE_SIZE:
            return jsonify({
                "error": f"Expected {STATE_SIZE} features, got {len(state)}"
            }), 400

        state_tensor = torch.tensor(state).unsqueeze(0)

        with torch.no_grad():
            q_values = model(state_tensor)
            action = int(torch.argmax(q_values, dim=1).item())

        return jsonify({
            "action": action,
            "action_name": ACTION_NAMES.get(action, "unknown"),
            "q_values": q_values.numpy().tolist()[0]
        })

    except Exception as e:

        logger.error(f"RL prediction error: {e}")

        return jsonify({"error": str(e)}), 500


# ======================================================
# RANDOM FOREST ADAPTIVE UI ENDPOINT
# ======================================================

@app.route("/adaptive-action", methods=["POST"])
def adaptive_action():
    """
    Adaptive UI action prediction using RandomForest model.
    
    Expected state vector:
    - Exactly 15 features in the specified training order
    - Extra features (beyond 15) are truncated
    - Missing features raise an error
    
    Returns:
    - action: predicted action ID (0-9)
    - action_name: human-readable action name
    - feature_count: number of features actually used
    - reason: "RandomForest model prediction"
    """
    try:
        logger.info("\n" + "="*70)
        logger.info("ADAPTIVE ACTION REQUEST RECEIVED")
        logger.info("="*70)

        if adaptive_model is None:
            logger.error("❌ Adaptive model not loaded")
            return jsonify({
                "error": "Adaptive model not loaded",
                "action": 0
            }), 500

        data = request.json
        logger.info(f"Incoming request data keys: {list(data.keys())}")

        # ========== EXTRACT STATE VECTOR ==========
        if "state" not in data:
            raise ValueError("Request must contain 'state' array")

        state = data["state"]
        incoming_state_length = len(state)
        
        logger.info(f"\n📊 STATE VECTOR VALIDATION")
        logger.info(f"  Incoming state vector length: {incoming_state_length}")
        logger.info(f"  Expected feature count: {EXPECTED_FEATURE_COUNT}")
        logger.info(f"  Model n_features_in_: {adaptive_model.n_features_in_ if hasattr(adaptive_model, 'n_features_in_') else 'N/A'}")

        # ========== VALIDATE STATE SIZE ==========
        if incoming_state_length < EXPECTED_FEATURE_COUNT:
            error_msg = (
                f"❌ INSUFFICIENT FEATURES: Expected {EXPECTED_FEATURE_COUNT} features, "
                f"got {incoming_state_length}. Cannot map to all required features."
            )
            logger.error(error_msg)
            raise ValueError(error_msg)

        # ========== TRUNCATE EXTRA FEATURES ==========
        if incoming_state_length > EXPECTED_FEATURE_COUNT:
            logger.warning(
                f"⚠️  EXTRA FEATURES DETECTED: Received {incoming_state_length} features, "
                f"but only {EXPECTED_FEATURE_COUNT} expected. Truncating extra features."
            )
            state = state[:EXPECTED_FEATURE_COUNT]
            logger.info(f"  Truncated state vector to: {len(state)} features")

        # ========== MAP STATE → FEATURE NAMES ==========
        input_data = {}
        logger.info(f"\n📋 FEATURE MAPPING (in training order):")
        
        for i, feature_name in enumerate(EXPECTED_FEATURE_COLUMNS):
            value = float(state[i])
            input_data[feature_name] = value
            logger.info(f"  [{i:2d}] {feature_name:30s} = {value:.6f}")

        # ========== CREATE DATAFRAME WITH EXPLICIT COLUMNS ==========
        df = pd.DataFrame([input_data])
        # Ensure columns are in the exact training order
        df = df[EXPECTED_FEATURE_COLUMNS]
        
        logger.info(f"\n📝 DATAFRAME FOR PREDICTION:")
        logger.info(f"  Shape: {df.shape}")
        logger.info(f"  Columns: {list(df.columns)}")
        logger.info(f"\n{df.to_string()}\n")

        # ========== VALIDATE DATAFRAME SCHEMA ==========
        if list(df.columns) != EXPECTED_FEATURE_COLUMNS:
            error_msg = (
                f"❌ COLUMN ORDER MISMATCH after DataFrame creation!\n"
                f"  Expected: {EXPECTED_FEATURE_COLUMNS}\n"
                f"  Got: {list(df.columns)}"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)

        # ========== PREDICT ACTION WITH PROBABILITY SAMPLING ==========
        logger.info("🤖 Running RandomForest prediction with probability sampling...")
        
        # Get class probabilities
        probs = adaptive_model.predict_proba(df)[0]
        logger.info(f"Action probabilities: {probs}")
        
        # Sample action proportionally to probabilities
        action = int(np.random.choice(len(probs), p=probs))
        confidence = float(np.max(probs))
        
        logger.info(f"  Sampled action: {action} (confidence: {confidence:.4f})")

        # ========== VALIDATE ACTION ==========
        if action not in ACTION_NAMES:
            logger.warning(f"⚠️  Invalid action {action}, falling back to noop (0)")
            action = 0

        result = {
            "action": int(action),
            "action_name": ACTION_NAMES.get(action),
            "confidence": confidence,
            "feature_count": EXPECTED_FEATURE_COUNT,
            "reason": "RandomForest probability sampling"
        }
        
        logger.info(f"\n✅ PREDICTION SUCCESSFUL")
        logger.info(f"  Action: {result['action']} ({result['action_name']})")
        logger.info(f"  Features used: {result['feature_count']}")
        logger.info("="*70 + "\n")

        return jsonify(result)

    except Exception as e:
        logger.error("\n" + "="*70)
        logger.error("❌ ERROR IN ADAPTIVE-ACTION ENDPOINT")
        logger.error(f"Exception: {str(e)}")
        logger.error("="*70 + "\n")

        return jsonify({
            "error": str(e),
            "action": 0,
            "fallback": True
        }), 500
# ======================================================
# MODEL INFO ENDPOINT (for debugging)
# ======================================================

@app.route("/model-info", methods=["GET"])
def model_info():
    """
    Returns detailed information about loaded models for debugging.
    """
    info = {
        "rl_model": {
            "state_dim": STATE_SIZE,
            "action_dim": ACTION_SIZE,
            "state_cols": state_cols
        },
        "adaptive_model": {
            "loaded": adaptive_model is not None,
            "n_features_in": adaptive_model.n_features_in_ if adaptive_model and hasattr(adaptive_model, 'n_features_in_') else None,
            "feature_columns": feature_columns,
            "expected_feature_columns": EXPECTED_FEATURE_COLUMNS,
            "expected_feature_count": EXPECTED_FEATURE_COUNT,
            "schema_valid": (
                adaptive_model is not None and 
                feature_columns == EXPECTED_FEATURE_COLUMNS and
                getattr(adaptive_model, 'n_features_in_', None) == EXPECTED_FEATURE_COUNT
            )
        }
    }
    return jsonify(info)


# ======================================================
# HEALTH CHECK
# ======================================================

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "adaptive_model_loaded": adaptive_model is not None,
        "rl_model_loaded": True
    })


# ======================================================
# START SERVER
# ======================================================

if __name__ == "__main__":
    app.run(port=5001, debug=True)