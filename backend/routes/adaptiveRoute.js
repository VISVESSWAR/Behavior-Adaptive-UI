
import axios from "axios";
import express from "express";

export const router = express.Router();

const ML_SERVER = "http://localhost:5001/predict-action";
const TIMEOUT_MS = 1200;   // prevent UI lag
const FALLBACK_ACTION = 0; // restore default layout

router.post("/adaptive-action", async (req, res) => {
  const { state } = req.body;

  // Basic validation
  if (!state || !Array.isArray(state)) {
    return res.status(400).json({ error: "State vector required" });
  }

  try {
    const mlResponse = await axios.post(
      ML_SERVER,
      { state },
      { timeout: TIMEOUT_MS }
    );

    return res.json({ action: mlResponse.data.action });

  } catch (error) {
    console.error("ML server failed:", error.message);

    // Fallback so UI never breaks
    return res.json({
      action: FALLBACK_ACTION,
      fallback: true
    });
  }
});
