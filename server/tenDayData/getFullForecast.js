import express from "express";
import chalk from "chalk";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

// API ID 2 = Full Forecast
router.get("/full", authenticateToken(2), async (req, res) => {
  const { municity, province } = req.query;

  if (!municity || !province) {
    return res.status(400).json({ error: "municity and province are required" });
  }

  const { api_ids } = req.user || {};
  const isAuthorized = api_ids?.some((id) => id === 0 || id === 2);

  const metadata = {
    api: "Full Forecast",
    forecast: "10-day Forecast",
  };

  const currentTimestamp = new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
  }).replace(",", "");

  const defaultMisc = {
    version: "1.0",
    total_count: 0,
    total_pages: 0,
    current_page: 1,
    per_page: 10,
    timestamp: currentTimestamp,
    method: "GET",
    status_code: 403,
    description: "Forbidden: Unauthorized API ID",
  };

  if (!isAuthorized) {
    return res.status(403).json({
      metadata,
      forecast: [],
      misc: defaultMisc,
    });
  }

  try {
    const requestId = await logApiRequest(req, 2);

    const normalizedMunicity = municity.replace(/ city/gi, "").trim().toLowerCase();
    const normalizedProvince = province.trim().toLowerCase();
    const baseKey = `forecast:${normalizedMunicity}:${normalizedProvince}`;

    const cachedForecast = await redisClient.hGet(baseKey, "forecast");
    const cachedMisc = await redisClient.hGet(baseKey, "misc");
    
    if (cachedForecast && cachedMisc) {
      console.log(
        chalk.bgGray.black(" Cache hit ") +
          " " +
          chalk.bgGreen.black(" Returning hash fields from Redis ")
      );
    
      const misc = JSON.parse(cachedMisc);
      misc.timestamp = new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      }).replace(",", "");
    
      return res.json({
        metadata: { ...metadata, request_no: requestId },
        forecast: JSON.parse(cachedForecast),
        misc,
      });
    }    

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

    const result = await pool.query(query, [municity, province]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        metadata: { ...metadata, request_no: requestId },
        forecast: [],
        misc: {
          ...defaultMisc,
          status_code: 200,
          description: "No forecast data found",
          timestamp: currentTimestamp,
        },
      });
    }

    const { municity: _municity, province: _province, start_date } = result.rows[0];

    const forecast = [
      {
        municity: _municity,
        province: _province,
        issuance_date: start_date.toLocaleString("en-PH").split(", ")[0],
      },
      ...result.rows.map((f) => ({
        date: f.date.toLocaleString("en-PH").split(", ")[0],
        rainfall: f.rainfall,
        total_rainfall: f.total_rainfall,
        cloud_cover: f.cloud_cover,
        mean: f.mean,
        min: f.min,
        max: f.max,
        humidity: f.humidity,
        speed: f.speed,
        direction: f.direction,
      })),
    ];

    const misc = {
      version: "1.0",
      total_count: result.rows.length,
      total_pages: 1,
      current_page: 1,
      per_page: 10,
      timestamp: new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      }).replace(",", ""),
      method: "GET",
      status_code: 200,
      description: "OK",
    };

    await redisClient.hSet(baseKey, {
      forecast: JSON.stringify(forecast),
      misc: JSON.stringify(misc),
    });
    await redisClient.expire(baseKey, 3600); // 1 hour

    console.log("❌ Cache miss - Fetched from database");

    res.json({
      metadata: { ...metadata, request_no: requestId },
      forecast,
      misc,
    });
  } catch (error) {
    console.error("Error executing forecast query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
