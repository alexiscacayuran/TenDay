import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();
const SECRET_KEY = process.env.jwtSecret;
const API_ID = 13;

// ----------------------
// Helpers
// ----------------------

// Validate that a date string exists and is correct (prevents invalid dates like June 31)
function isValidDate(input) {
  const date = new Date(input);
  if (isNaN(date.getTime())) return false;

  const [year, month, day] = input.split("T")[0].split("-").map(Number);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

// Convert YYYY-MM-DD to end-of-day 23:59:59 if no time is provided
function toEndOfDayManila(input) {
  // Parse YYYY-MM-DD
  const [year, month, day] = input.split("-").map(Number);

  // Create Date in Manila timezone (UTC+8)
  const date = new Date(Date.UTC(year, month - 1, day, 15, 0, 0)); 
  // 15:00 UTC = 23:00 Manila, then add 59 minutes and 59 seconds
  date.setMinutes(59);
  date.setSeconds(59);
  return date;
}

// Deterministic hash (for lookup only)
function makeHash(value) {
  return crypto.createHmac("sha256", SECRET_KEY).update(value).digest("hex");
}

// Encrypt / Decrypt using AES-256
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest();

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText) {
  const [ivHex, content] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(content, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Log Middleware Wrapper
const logMiddleware = async (req, res, next) => {
  try {
    await logApiRequest(req, API_ID);
  } catch (err) {
    console.error("⚠️ Log middleware error:", err.message);
  }
  next();
};

// ----------------------
// POST /generate-token
// ----------------------
router.post(
  "/generate-token",
  logMiddleware,
  authenticateToken(API_ID),
  async (req, res) => {
    if (!SECRET_KEY) {
      return res.status(500).json({ error: "jwtSecret is not set" });
    }

    try {
      // 1️⃣ Validate IP
      const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "";
      const cleanIp = clientIp.replace("::ffff:", "");
      const hashedIp = makeHash(cleanIp);

      const ipCheck = await pool.query(
        `SELECT 1 FROM ip WHERE ip_address = $1 LIMIT 1`,
        [hashedIp]
      );

      if (ipCheck.rowCount === 0) {
        return res.status(403).json({
          error: "Access denied. Your IP is not allowed to create tokens.",
        });
      }

      // 2️⃣ Validate Inputs
      const { organization, email, expires_in, expires_at, api_ids } = req.body;
      if (!organization || !email || !Array.isArray(api_ids) || api_ids.length === 0) {
        return res.status(400).json({
          error: "Organization, email, and at least one API ID are required",
        });
      }

      // 3️⃣ Check duplicates
      const orgExists = await pool.query(
        "SELECT 1 FROM api_tokens WHERE organization = $1",
        [organization]
      );
      if (orgExists.rowCount > 0) {
        return res.status(409).json({ error: "Organization is already recorded" });
      }

      const emailExists = await pool.query(
        "SELECT 1 FROM api_tokens WHERE email = $1",
        [email]
      );
      if (emailExists.rowCount > 0) {
        return res.status(409).json({ error: "Email is already recorded" });
      }

      // 4️⃣ Validate APIs
      const apiCheckResult = await pool.query(
        "SELECT id FROM api WHERE id = ANY($1)",
        [api_ids]
      );
      const validApiIds = apiCheckResult.rows.map((row) => row.id);
      if (validApiIds.length !== api_ids.length) {
        return res.status(400).json({ error: "One or more API IDs are invalid" });
      }

      // 5️⃣ Expiration
      let expiresAtFormatted = null;
      let tokenPayload = { organization, email, api_ids: validApiIds };
      let expUnix = null;

      // PRIORITY: expires_at (date string)
      if (expires_at && expires_at !== "lifetime") {
        if (!isValidDate(expires_at)) {
          return res.status(400).json({
            error: "Invalid date. Make sure the day exists for the month. Example: 2027-06-30",
          });
        }
        const expDate = toEndOfDayManila(expires_at);
        expUnix = Math.floor(expDate.getTime() / 1000);
      }
      // FALLBACK: expires_in (seconds or date string)
      else if (expires_in && expires_in !== "lifetime") {
        if (!isNaN(expires_in)) {
          expUnix = Math.floor(Date.now() / 1000) + parseInt(expires_in, 10);
        } else {
          if (!isValidDate(expires_in)) {
            return res.status(400).json({
              error: "Invalid expiration date format in expires_in",
            });
          }
          const expDate = toEndOfDay(expires_in);
          expUnix = Math.floor(expDate.getTime() / 1000);
        }
      }

      if (expUnix) {
        tokenPayload.exp = expUnix;
        expiresAtFormatted = new Date(expUnix * 1000).toLocaleString("en-US", {
          timeZone: "Asia/Manila",
          hour12: true,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // 6️⃣ Generate JWT
      const token = jwt.sign(tokenPayload, SECRET_KEY);

      // 7️⃣ Encrypt token for DB storage
      const encryptedToken = encrypt(token);

      // 8️⃣ Deterministic hash for lookup
      const token_hash = makeHash(token);

      // 9️⃣ Save to DB
      await pool.query(
        `INSERT INTO api_tokens
         (token, token_hash, organization, email, expires_at, created_at, api_ids)
         VALUES ($1, $2, $3, $4, $5,
         (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'), $6)`,
        [encryptedToken, token_hash, organization, email, expiresAtFormatted, validApiIds]
      );

      return res.json({ token, expires_at: expiresAtFormatted });
    } catch (error) {
      console.error("❌ Error generating token", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;