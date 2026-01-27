import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function initDB() {

  /* =====================================================
     USERS TABLE (EMAIL-ONLY IDENTITY)
     ===================================================== */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,

      -- Peer-based recovery only
      commitment TEXT,
      threshold INT,

      -- otp | peer
      recovery_mode TEXT
        CHECK (recovery_mode IN ('otp','peer'))
        NOT NULL
    );
  `);

  /* =====================================================
     SHARES TABLE (SHAMIR SECRET SHARES)
     ===================================================== */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shares (
      id SERIAL PRIMARY KEY,

      owner_email TEXT
        REFERENCES users(email)
        ON DELETE CASCADE,

      peer_email TEXT
        REFERENCES users(email)
        ON DELETE CASCADE,

      x INT NOT NULL,
      y TEXT NOT NULL,

      UNIQUE (owner_email, peer_email)
    );
  `);

  /* =====================================================
     RECOVERY REQUESTS (TAP-YES FLOW)
     ===================================================== */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recovery_requests (
      id SERIAL PRIMARY KEY,

      owner_email TEXT
        REFERENCES users(email)
        ON DELETE CASCADE,

      peer_email TEXT
        REFERENCES users(email)
        ON DELETE CASCADE,

      status TEXT
        CHECK (status IN ('pending','approved','declined'))
        NOT NULL,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      UNIQUE (owner_email, peer_email)
    );
  `);

  /* =====================================================
     OTP CODES (EMAIL OTP RECOVERY)
     ===================================================== */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      email TEXT PRIMARY KEY
        REFERENCES users(email)
        ON DELETE CASCADE,

      otp_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL
    );
  `);

  /* =====================================================
     RECOVERY SESSIONS (FINAL AUTHORIZATION GATE)
     ===================================================== */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recovery_sessions (
      email TEXT PRIMARY KEY
        REFERENCES users(email)
        ON DELETE CASCADE,

      verified BOOLEAN DEFAULT false,
      expires_at TIMESTAMP NOT NULL
    );
  `);

  /* =====================================================
     OPTIONAL PERFORMANCE INDEX
     ===================================================== */
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_recovery_sessions_expires
    ON recovery_sessions (expires_at);
  `);

  console.log(
    "PostgreSQL initialized ✔ Email OTP + Peer-based recovery enabled"
  );
}
