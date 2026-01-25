import express from "express";
import { pool } from "../db.js";
import { lagrange } from "../utils/shamir.js";
import { sha256 } from "../utils/hash.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const router = express.Router();

/* =====================================================
   METHOD 1 — QR-BASED RECOVERY (UNCHANGED)
   ===================================================== */

// Step 1: Start recovery (QR)
router.post("/start", async (req, res) => {
    const { email } = req.body;

    const result = await pool.query(
        "SELECT commitment, threshold FROM users WHERE email=$1",
        [email]
    );

    if (result.rowCount === 0)
        return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
});

// Step 2: Finish recovery (QR)
router.post("/finish", async (req, res) => {
    const { email, shares } = req.body;

    const userRes = await pool.query(
        "SELECT commitment FROM users WHERE email=$1",
        [email]
    );

    if (userRes.rowCount === 0)
        return res.json({ success: false, error: "User not found" });

    const commitment = userRes.rows[0].commitment;

    const masterKey = lagrange(shares);
    const hash = sha256(masterKey);

    if (hash === commitment) {
        return res.json({
            success: true,
            masterKey: masterKey.toString("hex")
        });
    }

    res.json({ success: false, error: "Invalid share set" });
});

/* =====================================================
   METHOD 2 — TAP-YES PEER APPROVAL
   ===================================================== */

// Step 3: Owner initiates Tap-Yes recovery (NO AUTH)
router.post("/tap/initiate", async (req, res) => {
    const { email: owner } = req.body;

    if (!owner) {
        return res.status(400).json({ error: "Owner email required" });
    }

    const peers = await pool.query(
        "SELECT peer_email FROM shares WHERE owner_email=$1",
        [owner]
    );

    if (peers.rowCount === 0) {
        return res.status(404).json({ error: "No peers found for this account" });
    }

    for (const p of peers.rows) {
        await pool.query(
            `INSERT INTO recovery_requests (owner_email, peer_email, status)
             VALUES ($1,$2,'pending')
             ON CONFLICT (owner_email, peer_email)
             DO UPDATE SET status='pending', created_at=NOW()`,
            [owner, p.peer_email]
        );
    }

    res.json({ success: true });
});

// Step 4: Peer views pending requests (AUTH REQUIRED)
router.get("/tap/requests", requireAuth, async (req, res) => {
    const peer = req.user.email;

    const result = await pool.query(
        `SELECT id, owner_email
         FROM recovery_requests
         WHERE peer_email=$1 AND status='pending'`,
        [peer]
    );

    res.json(result.rows);
});

// Step 5: Peer approves or declines (AUTH REQUIRED)
router.post("/tap/respond", requireAuth, async (req, res) => {
    const peer = req.user.email;
    const { requestId, decision } = req.body;

    if (!["approved", "declined"].includes(decision))
        return res.status(400).json({ error: "Invalid decision" });

    await pool.query(
        `UPDATE recovery_requests
         SET status=$1
         WHERE id=$2 AND peer_email=$3`,
        [decision, requestId, peer]
    );

    res.json({ success: true });
});

// Step 6: Owner fetches approved shares
router.get("/tap/shares/:owner", async (req, res) => {
    const owner = req.params.owner;

    const sharesRes = await pool.query(
        `SELECT s.x, s.y
         FROM shares s
         JOIN recovery_requests r
         ON s.peer_email = r.peer_email
         WHERE r.owner_email=$1 AND r.status='approved'`,
        [owner]
    );

    res.json(sharesRes.rows);
});
