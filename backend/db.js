import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function initDB() {

  // USERS TABLE
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password_hash TEXT,
      commitment TEXT,
      threshold INT,
      recovery_mode TEXT
    );
  `);

  // SHARES TABLE
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shares (
      id SERIAL PRIMARY KEY,
      owner_email TEXT REFERENCES users(email) ON DELETE CASCADE,
      peer_email TEXT REFERENCES users(email) ON DELETE CASCADE,
      x INT NOT NULL,
      y TEXT NOT NULL,
      UNIQUE (owner_email, peer_email)
    );
  `);

  // RECOVERY REQUESTS TABLE (NEW)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recovery_requests (
      id SERIAL PRIMARY KEY,
      owner_email TEXT REFERENCES users(email) ON DELETE CASCADE,
      peer_email TEXT REFERENCES users(email) ON DELETE CASCADE,
      status TEXT CHECK (status IN ('pending','approved','declined')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (owner_email, peer_email)
    );
  `);

  console.log("PostgreSQL initialized (local with recovery support).");
}
