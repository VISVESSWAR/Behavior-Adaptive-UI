import numpy as np
import torch
import json
from flask import Flask, request, jsonify

from models.q_network import QNetwork

app = Flask(__name__)

# ---------------- PATHS ----------------
MODEL_PATH = "models/ddqn_adaptive_ui_full_checkpoint.pth"
STATE_COLS_PATH = "models/dqn_state_cols_v2.json"

device = torch.device("cpu")

# ---------- LOAD CHECKPOINT ----------
checkpoint = torch.load(MODEL_PATH, map_location=device)

STATE_SIZE = checkpoint["state_dim"]
ACTION_SIZE = checkpoint["action_dim"]

print("State dim:", STATE_SIZE)
print("Action dim:", ACTION_SIZE)

# ---------- BUILD MODEL ----------
model = QNetwork(STATE_SIZE, ACTION_SIZE)
model.load_state_dict(checkpoint["policy_state_dict"])

model.eval()

print("✅ Policy network loaded")

# ---------- LOAD STATE ORDER ----------
state_cols = json.load(open(STATE_COLS_PATH))["s_cols"]

# ---------------- ROUTES ----------------

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
            "q_values": q_values.numpy().tolist()[0]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5001, debug=True)