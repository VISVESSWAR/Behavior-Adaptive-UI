import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT email, password_hash, recovery_mode FROM users WHERE email=$1",
    [email]
  );

  if (result.rowCount === 0)
    return res.status(401).json({ error: "Invalid credentials" });

  const user = result.rows[0];

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    token,
    recovery_mode: user.recovery_mode
  });
});
