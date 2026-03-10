import axios from "axios";
import express from "express";

export const router = express.Router();

const ML_SERVER = "http://localhost:5001/adaptive-action";
// const ML_SERVER = "http://localhost:5001/predict-action";
const TIMEOUT_MS = 1200; // prevent UI lag
const FALLBACK_ACTION = 0; // restore default layout

router.post("/adaptive-action", async (req, res) => {
  const {
    state,
    user_id,
    task_id,
    task_start_time,
    session_id,
    misclick_rate,
    task_completion_time,
    total_clicks,
    idle_time,
    adaptive_enabled,
  } = req.body;
  console.log("Received state vector for DQN prediction:", state);
  console.log(
    "Received metadata - user_id:",
    user_id,
    "task_id:",
    task_id,
    "task_start_time:",
    task_start_time,
  );
  // Basic validation
  if (!state || !Array.isArray(state)) {
    return res.status(400).json({ error: "State vector required" });
  }

  try {
    const mlPayload = {
      state,
      user_id: user_id || "anonymous",
      task_id: task_id || null,
      task_start_time: task_start_time || null,
      session_id: session_id || null,

      misclick_rate: misclick_rate ?? null,
      task_completion_time: task_completion_time ?? null,
      total_clicks: total_clicks ?? null,
      idle_time: idle_time ?? null,

      adaptive_enabled: adaptive_enabled ?? false,
    };

    const mlResponse = await axios.post(ML_SERVER, mlPayload, {
      timeout: TIMEOUT_MS,
    });
    console.log("ML server response:", mlResponse.data);

    return res.json({ action: mlResponse.data.action });
  } catch (error) {
    console.error("ML server failed:", error.message);

    // Fallback so UI never breaks
    return res.json({
      action: FALLBACK_ACTION,
      fallback: true,
    });
  }
});
