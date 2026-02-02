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

    if (!email || !password || !mode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔐 Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    /* ============================
       OPTION A — NORMAL USER (EMAIL OTP)
       ============================ */
    if (mode === "password") {
      // Check if user already exists
      const existingUser = await pool.query(
        "SELECT email FROM users WHERE email=$1",
        [email]
      );
      
      if (existingUser.rowCount > 0) {
        return res.status(400).json({ error: "User already registered" });
      }

      await pool.query(
        `INSERT INTO users (email, password_hash, recovery_mode)
         VALUES ($1,$2,'otp')`,
        [email, passwordHash]
      );

      return res.json({
        success: true,
        message: "Account created with email OTP recovery"
      });
    }

    /* ============================
       OPTION B — PEER RECOVERY
       ============================ */
    if (mode === "peer") {
      // Check if user already exists (one user-one recovery)
      const existingUser = await pool.query(
        "SELECT email FROM users WHERE email=$1",
        [email]
      );
      
      if (existingUser.rowCount > 0) {
        return res.status(400).json({ 
          error: "User already registered. One user can have only one recovery method." 
        });
      }

      if (!Array.isArray(peers) || peers.length !== numPeers) {
        return res.status(400).json({ error: "Peer count mismatch" });
      }

      if (threshold > numPeers) {
        return res.status(400).json({ error: "Threshold cannot exceed peers" });
      }

      // Check that all peer emails are different
      const uniquePeers = new Set(peers);
      if (uniquePeers.size !== peers.length) {
        return res.status(400).json({ 
          error: "All peer emails must be unique. Duplicate emails detected." 
        });
      }

      // Check that user email is not in the peers list
      if (peers.includes(email)) {
        return res.status(400).json({ 
          error: "User cannot be their own peer" 
        });
      }

      // 🔍 Verify peers exist
      for (const peerEmail of peers) {
        const peer = await pool.query(
          "SELECT email FROM users WHERE email=$1",
          [peerEmail]
        );
        if (!peer.rowCount) {
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
         VALUES ($1,$2,$3,$4,'peer')`,
        [email, passwordHash, commitment, threshold]
      );

      // 🔀 Shamir split
      const shares = shamirSplit(masterKey, numPeers, threshold);

      // 📦 Assign one share per peer
      for (let i = 0; i < peers.length; i++) {
        await pool.query(
          `INSERT INTO shares (owner_email, peer_email, x, y)
           VALUES ($1,$2,$3,$4)`,
          [email, peers[i], shares[i].x, shares[i].y]
        );
      }

      return res.json({
        success: true,
        message: "Peer recovery enabled. Shares assigned to peers."
      });
    }

    return res.status(400).json({ error: "Invalid signup mode" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});
