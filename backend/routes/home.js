import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { generateQR } from "../utils/qr.js";

export const router = express.Router();

/**
 * OPTION 1: List shared QR codes (acting as PEER)
 */
router.get("/shared-qr", requireAuth, async (req, res) => {
  const userEmail = req.user.email;

  const result = await pool.query(
    `SELECT owner_email, x, y
     FROM shares
     WHERE peer_email=$1`,
    [userEmail]
  );

  const qrList = [];
  for (const row of result.rows) {
    const qr = await generateQR(
      { x: row.x, y: row.y },
      row.owner_email
    );

    qrList.push({
      owner: row.owner_email,
      qr
    });
  }

  res.json(qrList);
});

/**
 * OPTION 2: Peer details (acting as OWNER)
 */
router.get("/peer-details", requireAuth, async (req, res) => {
  const userEmail = req.user.email;

  const result = await pool.query(
    `SELECT peer_email
     FROM shares
     WHERE owner_email=$1`,
    [userEmail]
  );

  res.json({
    owner: userEmail,
    peers: result.rows.map(r => r.peer_email)
  });
});
