import express from "express";
import Fuse from "fuse.js";
import { pool, redisClient } from "../../db.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { logApiRequest } from "../../middleware/logMiddleware.js";

const router = express.Router();

// Helper to normalize text (lowercase, trim, remove 'city', replace ñ with n)
const normalize = (str) =>
  str
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/\s*city\s*/gi, "")
    .trim();

router.get("/", authenticateToken(2), async (req, res) => {
  try {
    const token = req.headers["token"];

    const tokenResult = await pool.query(
      `SELECT id, organization, api_ids FROM api_tokens WHERE token = $1 LIMIT 1`,
      [token]
    );

    if (
      tokenResult.rows.length === 0 ||
      !tokenResult.rows[0].api_ids.includes(2)
    ) {
      return res.status(403).json({ error: "Forbidden: Unauthorized API access" });
    }

    const requestId = await logApiRequest(req, 2);
    if (!requestId) {
      return res.status(500).json({ error: "Failed to log API request" });
    }

    const { municity, province } = req.query;
    if (!municity || !province) {
      return res.status(400).json({ error: "municity and province are required" });
    }

    const normMunicity = normalize(municity);
    const normProvince = normalize(province);
    const cacheKey = `forecast_internal:${normMunicity}:${normProvince}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit - Returning data from Redis");
      return res.json(JSON.parse(cachedData));
    }

    // Fetch all known municities and provinces
    const muniRes = await pool.query("SELECT DISTINCT municity, province FROM municities");
    const municityList = muniRes.rows.map(row => ({
      originalMunicity: row.municity,
      originalProvince: row.province,
      municity: normalize(row.municity),
      province: normalize(row.province),
    }));

    // Fuzzy match using fuse.js
    const fuse = new Fuse(municityList, {
      keys: ["municity", "province"],
      threshold: 0.3,
    });

    const match = fuse.search({ municity: normMunicity, province: normProvince });
    if (match.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    const { originalMunicity, originalProvince } = match[0].item;

    const query = `
      SELECT 
        m.id AS location_id, m.municity, m.province, 
        d.id AS date_id, d.date, d.start_date, 
        r.total as rainfall_total,
        r.description as rainfall_desc, 
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
        m.municity = $1 
        AND m.province = $2
      ORDER BY 
        d.start_date DESC, date ASC
      LIMIT 10`;

    const values = [originalMunicity, originalProvince];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No forecast data found" });
    }

    const {
      location_id,
      municity: _municity,
      province: _province,
    } = result.rows[0];

    const data = {
      id: location_id,
      municity: _municity,
      province: _province,
      forecasts: result.rows.map((forecast) => ({
        forecast_id: forecast.date_id,
        date: forecast.date.toLocaleString("en-PH").split(", ")[0],
        start_date: forecast.start_date.toLocaleString("en-PH").split(", ")[0],
        rainfall: {
          total: forecast.rainfall_total,
          description: forecast.rainfall_desc,
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

    // ✅ Cache for 1 day (86400 seconds)
    await redisClient.set(cacheKey, JSON.stringify(data), "EX", 86400);

    console.log("Cache miss - Fetched from database");
    res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
