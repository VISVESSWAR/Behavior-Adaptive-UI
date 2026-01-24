import express from "express";
import { pool } from "../db.js";
import { lagrange } from "../utils/shamir.js";
import { sha256 } from "../utils/hash.js";

export const router = express.Router();

// Step 1: Start recovery
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

// Step 2: Finish recovery
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
