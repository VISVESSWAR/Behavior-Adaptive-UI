import numpy as np
import joblib
import json
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model

app = Flask(__name__)

# -------- LOAD ARTIFACTS --------
MODEL_PATH = "models/dqn_mouse_rl_model_v6.keras"
SCALER_PATH = "models/dqn_state_scaler_v2.pkl"
STATE_COLS_PATH = "models/dqn_state_cols_v2.json"

model = load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
state_cols = json.load(open(STATE_COLS_PATH))["s_cols"]
STATE_SIZE = len(state_cols)

@app.route("/predict-action", methods=["POST"])
def predict_action():
    try:
        data = request.json
        state = np.array(data["state"]).reshape(1, -1)

        if state.shape[1] != STATE_SIZE:
            return jsonify({"error": f"Expected {STATE_SIZE} features"}), 400

        state_scaled = scaler.transform(state)
        q_values = model.predict(state_scaled, verbose=0)
        action = int(np.argmax(q_values[0]))

        return jsonify({"action": action})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5001)