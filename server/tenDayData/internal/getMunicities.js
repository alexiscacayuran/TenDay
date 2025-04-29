import express from "express";
import { pool, redisClient } from "../../db.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { logApiRequest } from "../../middleware/logMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    // Validate API ID
    const tokenResult = await pool.query(
      `SELECT id, organization, api_ids FROM api_tokens WHERE token = $1 LIMIT 1`,
      [req.headers["token"]]
    );

    if (
      tokenResult.rows.length === 0 ||
      !tokenResult.rows[0].api_ids.includes(2)
    ) {
      return res.status(403).json({ error: "Forbidden: Unauthorized API access" });
    }

    // Log API request
    const requestId = await logApiRequest(req);
    if (!requestId) {
      return res.status(500).json({ error: "Failed to log API request" });
    }

    const { province } = req.query;
    if (!province) {
      return res.status(400).json({ error: "Province are required" });
    }

    const cacheKey = `province:${province}`;

    // Check cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit - Returning data from Redis");
      return res.json(JSON.parse(cachedData));
    }

    // Fetch from database
    const query = `
     SELECT municity FROM municities WHERE province = $1;`;

    const values = [province];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No forecast data found" });
    }

    const data = result.rows.map(row => row.municity);

    // Store in cache
    await redisClient.set(cacheKey, JSON.stringify(data), "EX", 3600);

    console.log("Cache miss - Fetching from database");
    res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;