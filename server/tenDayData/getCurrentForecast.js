import express from "express";
import { pool, redisClient } from "../db.js";

const router = express.Router();

router.get("/current", async (req, res) => {
  const { municity, province } = req.query;
  const now = new Date().toISOString().split("T")[0];

  // Generate a unique cache key based on municity, province, and date
  const cacheKey = `current:${municity || "all"}:${province || "all"}:${now}`;

  try {
    // Check Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("✅ Cache hit - Returning data from Redis");
      return res.json(JSON.parse(cachedData));
    }

    const query = `
        SELECT 
        m.id AS location_id, 
        m.municity, 
        m.province, 
        d.id AS date_id, 
        d.date,
        d.start_date,
        r.total as rainfall_total,
        r.description as rainfall_desc, 
        c.description as cloud_cover, 
        t.mean, t.min, t.max, 
        h.mean as humidity, 
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
        ($1::TEXT IS NOT NULL AND $1::TEXT <> '' OR $2::TEXT IS NOT NULL AND $2::TEXT <> '')
        AND
        REGEXP_REPLACE(m.municity, ' CITY', '', 'gi') ILIKE '%' || REGEXP_REPLACE($1, ' CITY', '', 'gi') || '%' 
        AND 
        m.province ILIKE '%' || $2 || '%' 
        AND d.date = $3 
      ORDER BY 
        d.start_date DESC 
      LIMIT 1
    `;

    const values = [municity, province, now];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    const {
      location_id,
      municity: _municity,
      province: _province,
      date_id,
      date,
      start_date,
      rainfall_total,
      rainfall_desc,
      cloud_cover,
      mean,
      min,
      max,
      humidity,
      speed,
      direction,
    } = result.rows[0];

    const data = {
      id: location_id,
      municity: _municity,
      province: _province,
      forecast: {
        forecast_id: date_id,
        date: date.toLocaleString("en-PH").split(", ")[0],
        start_date: start_date.toLocaleString("en-PH").split(", ")[0],
        rainfall: {
          total: rainfall_total,
          description: rainfall_desc,
        },
        cloud_cover: cloud_cover,
        temperature: {
          mean: mean,
          min: min,
          max: max,
        },
        humidity: humidity,
        wind: {
          speed: speed,
          direction: direction,
        },
      },
    };

    // Store in Redis cache for **10 days** (864000 seconds)
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 864000 });
    console.log("❌ Cache miss - Storing data in Redis for 10 days");

    return res.json(data);
  } catch (error) {
    console.error("❌ Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
