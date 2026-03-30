import crypto from "crypto";
import { pool } from "../db.js"; // Import DB connection

const SECRET_KEY = process.env.jwtSecret;

function makeTokenHash(rawToken) {
  return crypto.createHmac("sha256", SECRET_KEY).update(rawToken).digest("hex");
}

export const logApiRequest = async (req, api_id) => {
  const { originalUrl: endpoint, method, body, query, headers } = req;

  // Accept token from either query or header
  const token = query.token || headers["token"] || headers["authorization"];

  if (!token) {
    console.log("❌ No token provided. Skipping log.");
    return null;
  }

  try {
    let tokenResult = null;

    // ✅ NEW TOKENS: lookup by token_hash (fast)
    if (SECRET_KEY) {
      const token_hash = makeTokenHash(token);

      tokenResult = await pool.query(
        `SELECT id, organization, api_ids
         FROM api_tokens
         WHERE token_hash = $1
         LIMIT 1`,
        [token_hash]
      );
    }

    // ✅ LEGACY TOKENS: token stored raw and token_hash is null/blank
    if (!tokenResult || tokenResult.rows.length === 0) {
      tokenResult = await pool.query(
        `SELECT id, organization, api_ids
         FROM api_tokens
         WHERE token = $1 AND (token_hash IS NULL OR token_hash = '')
         LIMIT 1`,
        [token]
      );
    }

    if (tokenResult.rows.length === 0) {
      console.log("❌ Invalid token. Skipping log.");
      return null;
    }

    const { id: token_id, organization } = tokenResult.rows[0];

    const logResult = await pool.query(
      `INSERT INTO api_logs (organization, endpoint, method, request_time, request_body, request_query, api_id, token_id)
       VALUES ($1, $2, $3, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'), $4, $5, $6, $7)
       RETURNING id`,
      [
        organization,
        endpoint,
        method,
        JSON.stringify(body),
        JSON.stringify(query),
        api_id,
        token_id,
      ]
    );

    return logResult.rows[0].id;
  } catch (error) {
    console.error("🚨 Error logging API request:", error);
    return null;
  }
};
