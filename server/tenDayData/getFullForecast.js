import express from "express";
import chalk from "chalk";
import { pool, redisClient } from "../db.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { municity, province } = req.query;
  const token = req.headers["token"];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token required" });
  }

  try {
    // ✅ Validate token, API access, and check for expiration
    const tokenResult = await pool.query(
      `SELECT id, organization, api_ids, expires_at 
       FROM api_tokens 
       WHERE token = $1 
       AND 2 = ANY(api_ids) 
       LIMIT 1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: "Unauthorized: Invalid token or API access denied" });
    }

    const { expires_at } = tokenResult.rows[0];

    // ✅ Check if expired
    if (expires_at && new Date(expires_at) < new Date()) {
      return res.status(403).json({ error: "Forbidden: Token expired" });
    }

    // ✅ Log request
    const requestId = await logApiRequest(req, 2);
    if (!requestId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // ✅ Validate query
    if (!municity || !province) {
      return res.status(400).json({ error: "municity and province are required" });
    }

    const cacheKey = `forecast:${municity}:${province}`;

    // ✅ Redis cache check
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(
        chalk.bgGray.black(" Cache hit ") +
          " " +
          chalk.bgGreen.black(" Returning data from Redis ")
      );
      return res.json(JSON.parse(cachedData));
    }

    // ✅ Fetch forecast from DB
    const query = `
      SELECT 
        m.id AS location_id, m.municity, m.province, 
        d.id AS date_id, d.date, d.start_date, 
        r.description as rainfall, 
        r.total as total_rainfall,
        c.description as cloud_cover, 
        t.mean, t.min, t.max, 
        h.mean as humidity, 
        w.speed, w.direction 
      FROM 
        municities AS m 
      INNER JOIN date AS d ON m.id = d.municity_id 
      INNER JOIN rainfall as r ON d.id = r.date_id 
      INNER JOIN cloud_cover as c ON d.id = c.date_id 
      INNER JOIN temperature as t ON d.id = t.date_id 
      INNER JOIN humidity as h ON d.id = h.date_id 
      INNER JOIN wind as w ON d.id = w.date_id 
      WHERE
        REGEXP_REPLACE(m.municity, ' CITY', '', 'gi') ILIKE '%' || REGEXP_REPLACE($1, ' CITY', '', 'gi') || '%' 
        AND 
        m.province ILIKE '%' || $2 || '%' 
      ORDER BY 
        d.start_date DESC, date ASC
      LIMIT 10`;

    const values = [municity, province];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No forecast data found" });
    }

    const { location_id, municity: _municity, province: _province, start_date } = result.rows[0];

    const data = {
      metadata: {
        request_no: requestId,
        api: "Full Forecast",
        forecast: "10-day Forecast",
      },
      forecast: [
        {
          municity: _municity,
          province: _province,
          issuance_date: start_date.toLocaleString("en-PH").split(", ")[0],
        },
        ...result.rows.map((forecast) => ({
          location_id: forecast.location_id,
          date_id: forecast.date_id,
          date: forecast.date.toLocaleString("en-PH").split(", ")[0],
          rainfall: forecast.rainfall,
          total_rainfall: forecast.total_rainfall,
          cloud_cover: forecast.cloud_cover,
          mean: forecast.mean,
          min: forecast.min,
          max: forecast.max,
          humidity: forecast.humidity,
          speed: forecast.speed,
          direction: forecast.direction,
        })),
      ],
      misc: {
        version: "1.0",
        total_count: result.rows.length,
        total_pages: 1,
        current_page: 1,
        per_page: 10,
        timestamp: new Date().toLocaleString("en-CA", { timeZone: "Asia/Manila" }).replace(",", ""),
        method: "GET",
        status_code: 200,
        description: "OK",
      },
    };

    // ✅ Cache result in Redis
    await redisClient.set(cacheKey, JSON.stringify(data), "EX", 3600);

    console.log("❌ Cache miss - Fetching from database");
    res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
