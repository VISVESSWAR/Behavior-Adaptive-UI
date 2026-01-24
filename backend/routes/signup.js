import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { shamirSplit } from "../utils/shamir.js";
import { sha256 } from "../utils/hash.js";

export const router = express.Router();

/*
Expected body:
{
  email: "user@gmail.com",
  password: "secret123",
  mode: "password" | "peer",

  // only if mode === "peer"
  numPeers: 3,
  threshold: 2,
  peers: ["peer1@gmail.com", "peer2@gmail.com", "peer3@gmail.com"]
}
*/

router.post("/", async (req, res) => {
  try {
    const {
      email,
      password,
      mode,
      numPeers,
      threshold,
      peers
    } = req.body;

    // 🔐 Hash password (for both modes)
    const passwordHash = await bcrypt.hash(password, 10);

    // ============================
    // OPTION A — NORMAL SIGNUP
    // ============================
    if (mode === "password") {
      await pool.query(
        `INSERT INTO users (email, password_hash, recovery_mode)
         VALUES ($1,$2,'password')
         ON CONFLICT (email) DO NOTHING`,
        [email, passwordHash]
      );

      return res.json({ success: true });
    }

    // ============================
    // OPTION B — PEER RECOVERY
    // ============================
    if (mode === "peer") {
      if (peers.length !== numPeers)
        return res.status(400).json({ error: "Peer count mismatch" });

      if (threshold > numPeers)
        return res.status(400).json({ error: "k cannot be > n" });

      // 🔍 Verify peers exist
      for (const peerEmail of peers) {
        const peer = await pool.query(
          "SELECT email FROM users WHERE email=$1",
          [peerEmail]
        );
        if (peer.rowCount === 0) {
          return res.status(400).json({
            error: `Peer not registered: ${peerEmail}`
          });
        }
      }

      // 🔑 Generate master recovery secret
      const masterKey = crypto.randomBytes(32);
      const commitment = sha256(masterKey);

      await pool.query(
        `INSERT INTO users
         (email, password_hash, commitment, threshold, recovery_mode)
         VALUES ($1,$2,$3,$4,'peer')
         ON CONFLICT (email) DO NOTHING`,
        [email, passwordHash, commitment, threshold]
      );

      // 🔀 Shamir split
      const shares = shamirSplit(masterKey, numPeers, threshold);

      // 📦 Assign ONE share per peer
      for (let i = 0; i < peers.length; i++) {
        const peerEmail = peers[i];
        const share = shares[i];

        await pool.query(
          `INSERT INTO shares (owner_email, peer_email, x, y)
           VALUES ($1,$2,$3,$4)`,
          [email, peerEmail, share.x, share.y]
        );
      }

      return res.json({
        success: true,
        message: "Peer recovery enabled. Shares assigned to peers."
      });
    }

    res.status(400).json({ error: "Invalid signup mode" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});
