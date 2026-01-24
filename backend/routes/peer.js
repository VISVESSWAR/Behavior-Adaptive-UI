import express from "express";
import { pool } from "../db.js";
import { generateQR } from "../utils/qr.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const router = express.Router();

/**
 * GET /peer/share
 * Returns the QR share(s) assigned to the logged-in peer
 */
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
