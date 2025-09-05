import express from "express";
import Fuse from "fuse.js";
import { pool, redisClient } from "../../db.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { logApiRequest } from "../../middleware/logMiddleware.js";

const router = express.Router();

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
      return res
        .status(403)
        .json({ error: "Forbidden: Unauthorized API access" });
    }

    const requestId = await logApiRequest(req, 2);
    if (!requestId) {
      return res.status(500).json({ error: "Failed to log API request" });
    }

    const { municity, province } = req.query;
    if (!municity || !province) {
      return res
        .status(400)
        .json({ error: "municity and province are required" });
    }

    const cacheKey = `forecast_internal:${municity}:${province}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit - Returning data from Redis");
      return res.json(JSON.parse(cachedData));
    }

    try {
      const response = await fetch(
        "https://tendayforecast.s3.ap-southeast-1.amazonaws.com/utils/municities.json"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const municities = await response.json();

      // ⚡ Use Fuse.js to find closest match
      const fuse = new Fuse(municities, {
        location: 8,
        threshold: 0.6,
        distance: 30,
        useExtendedSearch: true,
        isCaseSensitive: false,
        includeScore: true,
        ignoreDiacritics: true,
        keys: ["municity", "province", "muniOld", "provOld"],
      });

      const results = fuse.search({
        $and: [
          {
            $or: [
              //search either new or old PSGC name for municity
              { municity: municity },
              { muniOld: municity },
            ],
          },
          {
            $or: [
              //search either new or old PSGC name for province
              { province: province },
              { provOld: province },
            ],
          },
        ],
      });

      if (results.length === 0) {
        return res.status(404).json({ error: "Location not found" });
      }

      const matchedMunicity = results[0].item.municity;
      const matchedProvince = results[0].item.province;

      const query = `
      SELECT DISTINCT ON (d.date)
      m.id AS location_id, m.municity, m.province,
      d.id AS date_id, d.date, d.start_date,
      r.total AS rainfall_total,
      r.description AS rainfall_desc, 
      c.description AS cloud_cover,
      t.mean, t.min, t.max,
      h.mean AS humidity,
      w.speed, w.direction
    FROM municities AS m
    INNER JOIN date AS d ON m.id = d.municity_id
    INNER JOIN rainfall AS r ON d.id = r.date_id
    INNER JOIN cloud_cover AS c ON d.id = c.date_id
    INNER JOIN temperature AS t ON d.id = t.date_id
    INNER JOIN humidity AS h ON d.id = h.date_id
    INNER JOIN wind AS w ON d.id = w.date_id
    WHERE m.municity = $1
      AND m.province = $2
      AND d.start_date = (
        SELECT MAX(d2.start_date)
        FROM date AS d2
        JOIN municities AS m2 ON m2.id = d2.municity_id
        WHERE m2.municity = $1 AND m2.province = $2
      )
    ORDER BY d.date ASC
    LIMIT 10;
    `;

      const values = [matchedMunicity, matchedProvince];
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
          start_date: forecast.start_date
            .toLocaleString("en-PH")
            .split(", ")[0],
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

      // ✅ Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(data), "EX", 3600); //1 Hour

      console.log("Cache miss - Fetched from database");
      res.json(data);
    } catch (error) {
      console.error("Failed to load JSON:", error);
      return null;
    }
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
