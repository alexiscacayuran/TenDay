// authFileMiddleware.js
import { pool } from "../db.js";
import crypto from "crypto";

const SECRET_KEY = process.env.jwtSecret;

/**
 * Make a token hash for lookup
 */
export function makeTokenHash(rawToken) {
  return crypto.createHmac("sha256", SECRET_KEY).update(rawToken).digest("hex");
}

/**
 * Normalize API IDs from PostgreSQL (array or string)
 */
export function normalizeApiIds(api_ids) {
  if (Array.isArray(api_ids)) {
    return api_ids.map(Number).filter(Number.isFinite);
  }
  if (typeof api_ids === "string") {
    return api_ids
      .replace(/[{}]/g, "")
      .split(",")
      .map(s => Number(s.trim()))
      .filter(Number.isFinite);
  }
  return [];
}

/**
 * Middleware to authenticate token and API access
 * @param {Request} req - Express request
 * @param {number} REQUIRED_API_ID - ID of the API being accessed
 */
export async function authFileMiddleware(req, REQUIRED_API_ID) {
  const token = req.query.token;
  if (!token) {
    const err = new Error("Missing token");
    err.status = 400;
    throw err;
  }

  let row = null;

  // 🔹 NEW TOKENS: AES decrypt + match
  if (SECRET_KEY) {
    const token_hash = makeTokenHash(token);
    const r1 = await pool.query(
      `SELECT id, organization, status, expires_at, api_ids, token, token_hash
       FROM api_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [token_hash]
    );

    if (r1.rows.length > 0) {
      const candidate = r1.rows[0];
      try {
        const [ivHex, content] = (candidate.token || "").split(":");
        let decryptedToken = null;

        if (ivHex && content && ivHex.length === 32) {
          const iv = Buffer.from(ivHex, "hex");
          const key = crypto.createHash("sha256").update(SECRET_KEY).digest();
          const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
          decryptedToken = decipher.update(content, "hex", "utf8") + decipher.final("utf8");
        }

        if (decryptedToken === token) row = candidate;
      } catch (err) {
        // fallback: ignore decryption error
      }
    }
  }

  // 🔹 OLD TOKENS: raw compare
  if (!row) {
    const r2 = await pool.query(
      `SELECT id, organization, status, expires_at, api_ids, token, token_hash
       FROM api_tokens
       WHERE token = $1 AND (token_hash IS NULL OR token_hash = '')
       LIMIT 1`,
      [token]
    );
    if (r2.rows.length > 0) row = r2.rows[0];
  }

  if (!row) {
    const err = new Error("Invalid token.");
    err.status = 403;
    throw err;
  }

  if (row.status !== 1) {
    const err = new Error("Token not activated.");
    err.status = 403;
    throw err;
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    const err = new Error("Token expired.");
    err.status = 403;
    throw err;
  }

  const allowedApiIds = normalizeApiIds(row.api_ids);
  if (!allowedApiIds.includes(REQUIRED_API_ID)) {
    const err = new Error("Unauthorized to access this API.");
    err.status = 403;
    throw err;
  }

  // attach token info to request for logging
  req.token_id = row.id;
  req.token_org = row.organization;
}