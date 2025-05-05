import express from "express";
import { pool, redisClient } from "../db.js";

const router = express.Router();

router.get("/current-all", async (req, res) => {
  const now = new Date().toISOString().split("T")[0];
  const cacheKey = `current-all:${now}`;

  try {
    // Check if data exists in Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("✅ Cache hit - Returning data from Redis");
      return res.json(JSON.parse(cachedData));
    }

    console.log("❌ Cache miss - Fetching data from database");

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
        WHERE d.date = $1
        ORDER BY d.start_date DESC`;
    
    const values = [now];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    const data = {
      id: location_id,
      municity: _municity,
      province: _province,
      forecasts: result.rows.map((forecast) => ({
        forecast_id: forecast.date_id,
        date: forecast.date.toLocaleString("en-PH").split(", ")[0],
        start_date: forecast.start_date.toLocaleString("en-PH").split(", ")[0],
        rainfall: {
          description: forecast.rainfall, 
          total: forecast.total_rainfall, 
        },
        cloud_cover: forecast.cloud_cover,
        temperature: {
          mean: forecast.mean,
          min: forecast.min,
          max: forecast.max,
        },
        humidity: forecast.humidity,
        wind: {
          speed: forecast.speed,
          direction: forecast.direction,
        },
      })),
    };    

    // Store result in Redis cache for 10 days (864000 seconds)
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 864000 });
    console.log("📝 Data stored in Redis cache for 10 days");

    return res.json(data);
  } catch (error) {
    console.error("❌ Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
