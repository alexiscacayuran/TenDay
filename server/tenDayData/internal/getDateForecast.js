import express from "express";
import { pool, redisClient } from "../../db.js";
import Fuse from "fuse.js";
import { logApiRequest } from "../../middleware/logMiddleware.js";
import fs from "fs";

const router = express.Router();

router.get("/", async (req, res) => {
  const { municity, province, date } = req.query;

  const requestNo = await logApiRequest(req, 4);

  if (!municity || !province || !date) {
    return res
      .status(400)
      .json({ error: "municity, province, and date are required" });
  }

  const cacheKey = `dateForecast_internal:${municity}:${province}:${date}`;

  try {
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
      SELECT 
        m.id AS location_id, 
        m.municity, 
        m.province, 
        d.id AS date_id, 
        d.date,
        d.start_date,
        r.total as total,
        r.description as desc, 
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
        m.municity = $1 AND 
        m.province = $2 AND 
        d.date = $3 
      ORDER BY 
        d.start_date DESC 
      LIMIT 1
    `;

      const values = [matchedMunicity, matchedProvince, date];
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "No data found" });
      }

      const row = result.rows[0];

      const data = {
        id: row.location_id,
        municity: row.municity,
        province: row.province,
        forecast: {
          forecast_id: row.date_id,
          date: row.date.toLocaleDateString("en-PH"),
          start_date: row.start_date.toLocaleDateString("en-PH"),
          rainfall: {
            total: row.total,
            desc: row.desc,
          },
          cloud_cover: row.cloud_cover,
          temperature: {
            mean: row.mean,
            min: row.min,
            max: row.max,
          },
          humidity: row.humidity,
          wind: {
            speed: row.speed,
            direction: row.direction,
          },
        },
      };

      await redisClient.set(cacheKey, JSON.stringify(data), "EX", 86400); // 1 day

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
