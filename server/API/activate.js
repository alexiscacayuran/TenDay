import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/v1/validate", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const result = await pool.query(
      "SELECT status, expires_at, api_ids FROM api_tokens WHERE token = $1",
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Token not found" });
    }

    const { status, expires_at, api_ids } = result.rows[0];

    // 🔍 Get API names based on ids
    const apiNamesResult = await pool.query(
      "SELECT name FROM api WHERE id = ANY($1)",
      [api_ids]
    );
    const authorized_apis = apiNamesResult.rows.map(row => row.name);

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
      });
    }

    // ✅ Activate token
    await pool.query(
        "UPDATE api_tokens SET status = 1, activated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila') WHERE token = $1",
        [token]
      );      

    return res.json({
      message: "Token activated successfully",
      expiration,
      authorized_apis,
    });

  } catch (error) {
    console.error("❌ Error activating token", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
