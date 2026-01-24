import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password_hash TEXT,
      commitment TEXT,
      threshold INT,
      recovery_mode TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shares (
      id SERIAL PRIMARY KEY,
      owner_email TEXT REFERENCES users(email),
      peer_email TEXT REFERENCES users(email),
      x INT,
      y TEXT
    );
  `);

  console.log("PostgreSQL initialized (local).");
}
