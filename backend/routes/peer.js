import express from "express";
import { pool } from "../db.js";
import { generateQR } from "../utils/qr.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const router = express.Router();

// GET /peer/users
// Returns list of all registered users (for transaction recipient dropdown)
router.get("/users", requireAuth, async (req, res) => {
  try {
    const currentUserEmail = req.user.email;
    
    const result = await pool.query(
      `SELECT email FROM users WHERE email != $1 ORDER BY email ASC`,
      [currentUserEmail]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /peer/share
// Returns the QR share(s) assigned to the logged-in peer
router.get("/share", requireAuth, async (req, res) => {
  try {
    const peerEmail = req.user.email; // set by auth middleware

    const result = await pool.query(
      `SELECT owner_email, x, y
       FROM shares
       WHERE peer_email=$1`,
      [peerEmail]
    );

    // Convert each share into QR code
    const qrShares = [];
    for (const row of result.rows) {
      const qr = await generateQR(
        { x: row.x, y: row.y },
        row.owner_email
      );

      qrShares.push({
        owner: row.owner_email,
        qr
      });
    }

    res.json(qrShares);
  } catch (err) {
    console.error("Peer share error:", err);
    res.status(500).json({ error: err.message });
  }
});
