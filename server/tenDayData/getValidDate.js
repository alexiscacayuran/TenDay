import express from "express";
import { pool, redisClient } from "../db.js"; // Import Redis connection

const router = express.Router();

router.get("/", async (req, res) => {
  const cacheKey = "latestValidDate";

  try {
    // Check Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit - Returning latest date from Redis");
      return res.json(JSON.parse(cachedData));
    }

    // Query PostgreSQL if not cached
    const query = `SELECT MAX(start_date) as latest_date FROM date`;
    const result = await pool.query(query);
    
    if (!result.rows.length || !result.rows[0].latest_date) {
      return res.status(404).json({ message: "No valid date found" });
    }

    const { latest_date } = result.rows[0];
    const formattedDate = latest_date.toLocaleString("en-PH").split(", ")[0];

    const data = { latest_date: formattedDate };

    // Store result in Redis cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(data), "EX", 3600);

    console.log("Cache miss - Fetching latest date from database");
    res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
