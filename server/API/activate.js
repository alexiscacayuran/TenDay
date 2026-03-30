import express from "express";
import crypto from "crypto";
import { pool } from "../db.js";

const router = express.Router();
const SECRET_KEY = process.env.jwtSecret;

function makeTokenHash(rawToken) {
  return crypto.createHmac("sha256", SECRET_KEY).update(rawToken).digest("hex");
}

router.get("/v1/validate", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  if (!SECRET_KEY) {
    return res.status(500).json({ error: "jwtSecret is not set" });
  }

  try {
    // 1) New tokens: lookup via token_hash (fast + works with bcrypt stored token)
    const token_hash = makeTokenHash(token);

    let result = await pool.query(
      "SELECT status, expires_at, api_ids FROM api_tokens WHERE token_hash = $1",
      [token_hash]
    );

    let matchedBy = "hash";

    // 2) Legacy fallback: old tokens stored raw and token_hash is null/blank
    if (result.rowCount === 0) {
      result = await pool.query(
        "SELECT status, expires_at, api_ids FROM api_tokens WHERE token = $1 AND (token_hash IS NULL OR token_hash = '')",
        [token]
      );
      matchedBy = "legacy";
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Token not found" });
    }

    const { status, expires_at, api_ids } = result.rows[0];

    // 🔍 Get API names based on ids
    const apiNamesResult = await pool.query(
      "SELECT name FROM api WHERE id = ANY($1)",
      [api_ids]
    );
    const authorized_apis = apiNamesResult.rows.map((row) => row.name);

    // Format expiration date
    let expiration = "Lifetime Access";
    if (expires_at) {
      const date = new Date(expires_at);
      expiration = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }

    if (status === 1) {
      return res.json({
        message: "Token is already activated",
        expiration,
        authorized_apis,
        matchedBy, // optional debug
      });
    }

    // ✅ Activate token (update depends on how it was matched)
    if (matchedBy === "hash") {
      await pool.query(
        "UPDATE api_tokens SET status = 1, activated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila') WHERE token_hash = $1",
        [token_hash]
      );
    } else {
      await pool.query(
        "UPDATE api_tokens SET status = 1, activated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila') WHERE token = $1 AND (token_hash IS NULL OR token_hash = '')",
        [token]
      );
    }

    return res.json({
      message: "Token activated successfully",
      expiration,
      authorized_apis,
      matchedBy, // optional debug
    });
  } catch (error) {
    console.error("❌ Error activating token", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
