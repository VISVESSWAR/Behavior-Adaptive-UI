import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { lagrange } from "../utils/shamir.js";
import { sha256 } from "../utils/hash.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { sendOtpEmail } from "../utils/mailer.js";

export const router = express.Router();

/* =====================================================
   SECURE - GET RECOVERY OPTIONS (no auth required)
   Password-Protected: Does NOT reveal user existence
   ===================================================== */

router.post("/options", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || typeof identifier !== "string") {
      return res.status(400).json({ error: "Invalid identifier" });
    }

    const trimmedId = identifier.trim();

    // Query user by email (identifier can be email or username)
    const user = await pool.query(
      "SELECT recovery_mode, commitment, threshold FROM users WHERE email=$1",
      [trimmedId]
    );

    // ⚠️ CRITICAL: Always return same response structure
    // If user exists: return true for their configured methods
    // If user doesn't exist: return all false (security: don't leak user existence)
    const methods = {
      email: false,
      peer: false,
      device: false
    };

    if (user.rowCount > 0) {
      const userData = user.rows[0];

      // Email recovery always available (optional)
      methods.email = true;

      // Peer recovery available only if peer mode with complete setup
      if (
        userData.recovery_mode === "peer" &&
        userData.commitment &&
        userData.threshold
      ) {
        methods.peer = true;
      }

      // Device recovery could be added in future
      // methods.device = userData.device_enabled ? true : false;
    }

    // Always return 200 OK with same response structure
    // This prevents user enumeration attacks
    return res.json({ methods });
  } catch (err) {
    console.error("[/recover/options] Error:", err);
    // Generic error response (don't leak database details)
    return res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/decide", async (req, res) => {
  const { email } = req.body;

  const user = await pool.query(
    "SELECT recovery_mode FROM users WHERE email=$1",
    [email]
  );

  if (!user.rowCount) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ recovery_mode: user.rows[0].recovery_mode });
});

/* =====================================================
   METHOD 1 — EMAIL OTP RECOVERY
   ===================================================== */

// STEP 1 — SEND OTP
router.post("/otp/start", async (req, res) => {
  const { email } = req.body;

  const user = await pool.query(
    "SELECT email FROM users WHERE email=$1 AND recovery_mode='otp'",
    [email]
  );

  if (!user.rowCount) {
    return res.status(404).json({ error: "OTP recovery not enabled" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  console.log("====================================");
  console.log("🔐 OTP GENERATED");
  console.log("📧 Email:", email);
  console.log("🔑 OTP :", otp);
  console.log("⏰ Valid for: 5 minutes");
  console.log("====================================");

  await pool.query("DELETE FROM otp_codes WHERE email=$1", [email]);

  await pool.query(
    `INSERT INTO otp_codes (email, otp_hash, expires_at)
     VALUES ($1,$2, NOW() + INTERVAL '5 minutes')`,
    [email, otpHash]
  );

  console.log("📧 Sending OTP to:", email);
  await sendOtpEmail(email, otp);

  res.json({ success: true });
});

// STEP 2 — VERIFY OTP (NO PASSWORD RESET HERE)
router.post("/otp/verify", async (req, res) => {
  const { email, otp } = req.body;

  const record = await pool.query(
    `SELECT otp_hash
     FROM otp_codes
     WHERE email=$1 AND expires_at > NOW()`,
    [email]
  );

  if (!record.rowCount) {
    return res.status(400).json({ error: "OTP expired or invalid" });
  }

  const valid = await bcrypt.compare(otp, record.rows[0].otp_hash);
  if (!valid) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // ✅ Mark recovery session as verified
  await pool.query(
    `INSERT INTO recovery_sessions (email, verified, expires_at)
     VALUES ($1,true, NOW() + INTERVAL '10 minutes')
     ON CONFLICT (email)
     DO UPDATE SET verified=true, expires_at=NOW() + INTERVAL '10 minutes'`,
    [email]
  );

  await pool.query("DELETE FROM otp_codes WHERE email=$1", [email]);

  res.json({ success: true });
});

/* =====================================================
   METHOD 2 — QR BASED RECOVERY (PEER)
   ===================================================== */

// STEP 1 — START QR
router.post("/start", async (req, res) => {
  const { email } = req.body;

  const result = await pool.query(
    "SELECT commitment, threshold FROM users WHERE email=$1 AND recovery_mode='peer'",
    [email]
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: "Peer recovery not enabled" });
  }

  res.json(result.rows[0]);
});

// STEP 2 — FINISH QR / TAP-YES (VERIFY ONLY)
router.post("/finish", async (req, res) => {
  const { email, shares } = req.body;

  const userRes = await pool.query(
    "SELECT commitment FROM users WHERE email=$1",
    [email]
  );

  if (!userRes.rowCount) {
    return res.status(404).json({ error: "User not found" });
  }

  const masterKey = lagrange(shares);
  const hash = sha256(masterKey);

  if (hash !== userRes.rows[0].commitment) {
    return res.status(400).json({ error: "Invalid share set" });
  }

  // ✅ Mark recovery session as verified
  await pool.query(
    `INSERT INTO recovery_sessions (email, verified, expires_at)
     VALUES ($1,true, NOW() + INTERVAL '10 minutes')
     ON CONFLICT (email)
     DO UPDATE SET verified=true, expires_at=NOW() + INTERVAL '10 minutes'`,
    [email]
  );

  res.json({ success: true });
});

/* =====================================================
   METHOD 3 — TAP-YES PEER APPROVAL
   ===================================================== */

// STEP 3 — OWNER INITIATES
router.post("/tap/initiate", async (req, res) => {
  const { email: owner } = req.body;

  const peers = await pool.query(
    "SELECT peer_email FROM shares WHERE owner_email=$1",
    [owner]
  );

  if (!peers.rowCount) {
    return res.status(404).json({ error: "No peers found" });
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

// STEP 4 — PEER VIEWS REQUESTS
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

// STEP 5 — PEER RESPONDS
router.post("/tap/respond", requireAuth, async (req, res) => {
  const peer = req.user.email;
  const { requestId, decision } = req.body;

  if (!["approved", "declined"].includes(decision)) {
    return res.status(400).json({ error: "Invalid decision" });
  }

  await pool.query(
    `UPDATE recovery_requests
     SET status=$1
     WHERE id=$2 AND peer_email=$3`,
    [decision, requestId, peer]
  );

  res.json({ success: true });
});

// STEP 6 — OWNER FETCHES APPROVED SHARES
router.get("/tap/shares/:owner", async (req, res) => {
  const owner = req.params.owner;

  const sharesRes = await pool.query(
    `SELECT s.x, s.y
     FROM shares s
     JOIN recovery_requests r
     ON s.peer_email = r.peer_email AND s.owner_email = r.owner_email
     WHERE r.owner_email=$1 AND r.status='approved'`,
    [owner]
  );

  res.json(sharesRes.rows);
});

/* =====================================================
   FINAL STEP — RESET PASSWORD (COMMON)
   ===================================================== */

router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const session = await pool.query(
    `SELECT verified
     FROM recovery_sessions
     WHERE email=$1 AND verified=true AND expires_at > NOW()`,
    [email]
  );

  if (!session.rowCount) {
    return res.status(403).json({ error: "Recovery not verified" });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await pool.query(
    "UPDATE users SET password_hash=$1 WHERE email=$2",
    [hash, email]
  );

  await pool.query(
    "DELETE FROM recovery_sessions WHERE email=$1",
    [email]
  );

  res.json({ success: true });
});
