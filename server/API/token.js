import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();
const SECRET_KEY = process.env.jwtSecret;

router.post("/generate-token", async (req, res) => {
  const { organization, expires_in, api_ids } = req.body; // Accept an array of API IDs

  if (!organization || !Array.isArray(api_ids) || api_ids.length === 0) {
    return res.status(400).json({ error: "Organization and at least one API ID are required" });
  }

  try {
    // ✅ Validate API IDs
    const apiCheckQuery = "SELECT id FROM api WHERE id = ANY($1)";
    const apiCheckResult = await pool.query(apiCheckQuery, [api_ids]);

    const validApiIds = apiCheckResult.rows.map(row => row.id);

    if (validApiIds.length !== api_ids.length) {
      return res.status(400).json({ error: "One or more API IDs are invalid" });
    }

    // ✅ Set expiration time (if provided)
    let expires_at = null;
    let tokenPayload = { organization, api_ids };

    if (expires_in && expires_in !== "lifetime") {
      const expirationTime = Math.floor(Date.now() / 1000) + parseInt(expires_in, 10);
      tokenPayload.exp = expirationTime;
      expires_at = new Date(expirationTime * 1000).toLocaleString('en-US', { 
        timeZone: 'Asia/Manila', 
        hour12: true, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(tokenPayload, SECRET_KEY);

    // ✅ Insert token into database
    const insertQuery = `
      INSERT INTO api_tokens (token, organization, expires_at, created_at, api_ids) 
      VALUES ($1, $2, $3, NOW(), $4) RETURNING token
    `;
    const values = [token, organization, expires_at, validApiIds]; // Store as an array
    const result = await pool.query(insertQuery, values);

    return res.json({ token: result.rows[0].token, expires_at });
  } catch (error) {
    console.error("❌ Error generating token", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
