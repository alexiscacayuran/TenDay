import express from "express";
import chalk from "chalk";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  const { municity, province, date } = req.query;
  const token = req.headers["token"];

  if (!municity || !province || !date) {
    return res.status(400).json({ error: "municity, province, and date are required" });
  }

  try {
    // ✅ Fetch API ID from `api_tokens` table
    const tokenResult = await pool.query(
      `SELECT api_ids FROM api_tokens WHERE token = $1 LIMIT 1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { api_ids } = tokenResult.rows[0];

    // ✅ Ensure API ID array contains "4"
    if (!api_ids.includes(4)) {
      console.log("❌ Unauthorized API ID:", api_ids);
      return res.status(403).json({ error: "Forbidden: Unauthorized API ID" });
    }

    // ✅ Log API request
    const requestNo = await logApiRequest(req, 4);

    const cacheKey = `dateForecast:${municity}:${province}:${date}`;

    // Check Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(chalk.bgGray.black(" Cache hit ") + " " + chalk.bgGreen.black(" Returning data from Redis "));
      return res.json(JSON.parse(cachedData));
    }

    // Query PostgreSQL if not cached
    const query = `
      SELECT 
        m.id AS location_id, 
        m.municity, 
        m.province, 
        d.id AS date_id, 
        d.date,
        d.start_date AS issuance_date,
        r.total AS total_rainfall,
        r.description AS rainfall, 
        c.description AS cloud_cover, 
        t.mean, t.min, t.max, 
        h.mean AS humidity, 
        w.speed, w.direction 
      FROM 
        municities AS m 
      INNER JOIN date AS d ON m.id = d.municity_id 
      INNER JOIN rainfall AS r ON d.id = r.date_id 
      INNER JOIN cloud_cover AS c ON d.id = c.date_id 
      INNER JOIN temperature AS t ON d.id = t.date_id 
      INNER JOIN humidity AS h ON d.id = h.date_id 
      INNER JOIN wind AS w ON d.id = w.date_id 
      WHERE
        REGEXP_REPLACE(m.municity, ' CITY', '', 'gi') ILIKE '%' || REGEXP_REPLACE($1, ' CITY', '', 'gi') || '%' 
        AND 
        m.province ILIKE '%' || $2 || '%' 
        AND d.date = $3 
      ORDER BY 
        d.start_date DESC 
      LIMIT 10`;

    const values = [municity, province, date];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    const issuanceDate = result.rows[0].issuance_date.toLocaleString("en-PH").split(", ")[0];

    const data = result.rows.map((row) => ({
      location_id: row.location_id,
      date_id: row.date_id,
      date: row.date.toLocaleString("en-PH").split(", ")[0],
      rainfall: row.rainfall,
      total_rainfall: row.total_rainfall,
      cloud_cover: row.cloud_cover,
      mean: row.mean,
      min: row.min,
      max: row.max,
      humidity: row.humidity,
      speed: row.speed,
      direction: row.direction,
    }));

    const response = {
      metadata: {
        request_no: requestNo, 
        api: "Forecast by Date",
        forecast: "10-day Forecast",
      },
      data: [
        {
          municity: result.rows[0].municity,
          province: result.rows[0].province,
          issuance_date: issuanceDate,
        },
        ...data,
      ],
      footer: {
        version: "1.0",
        total_count: data.length,
        total_pages: 1,
        current_page: 1,
        per_page: 10,
        timestamp: new Date().toLocaleString("en-PH"),
        method: "GET",
        status_code: 200,
        description: "OK",
      },
    };

    // Store result in Redis cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(response), "EX", 3600);

    console.log("❌ Cache miss - Fetching from database");
    res.json(response);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
