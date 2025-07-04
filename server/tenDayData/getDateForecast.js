import express from "express";
import chalk from "chalk";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/tenday/date", authenticateToken(4), async (req, res) => {
  const { municity, province, date } = req.query;
  const token = req.headers["token"];

  const baseFooter = {
    version: "1.0",
    timestamp: new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
    }).replace(",", ""),
    method: "GET",
    current_page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 0,
  };

  if (!municity || !province || !date) {
    return res.status(400).json({
      metadata: {
        api: "Forecast by Date",
        forecast: "10-day Forecast",
      },
      data: {},
      misc: {
        ...baseFooter,
        status_code: 400,
        description: "Bad Request: municity, province, and date param is required",
      },
    });
  }

  try {
    const tokenResult = await pool.query(
      `SELECT api_ids FROM api_tokens WHERE token = $1 LIMIT 1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        metadata: {
          api: "Forecast by Date",
          forecast: "10-day Forecast",
        },
        data: {},
        misc: {
          ...baseFooter,
          status_code: 401,
          description: "Unauthorized: Invalid token or expired token",
        },
      });
    }

    const { api_ids } = tokenResult.rows[0];

    if (!api_ids.includes(4)) {
      return res.status(403).json({
        metadata: {
          api: "Forecast by Date",
          forecast: "10-day Forecast",
        },
        data: {},
        misc: {
          ...baseFooter,
          status_code: 403,
          description: "Forbidden: You are not authorized to access this API.",
        },
      });
    }

    const requestNo = await logApiRequest(req, 4);
    const cacheKey = `dateForecast:${token}:${municity}:${province}:${date}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      console.log(chalk.bgGray.black(" Cache hit ") + " " + chalk.bgGreen.black(" Returning data from Redis "));
      const response = JSON.parse(cachedData);
      response.metadata.request_no = requestNo;
      response.misc.timestamp = new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      }).replace(",", "");
      return res.json(response);
    }

    const query = `
      SELECT 
        m.id AS location_id, 
        m.municity, 
        m.province,
        m.region,
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
      LIMIT 1`;

    const values = [municity, province, date];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        metadata: {
          request_no: requestNo,
          api: "Forecast by Date",
          forecast: "10-day Forecast",
        },
        data: {},
        misc: {
          ...baseFooter,
          status_code: 404,
          description: "No content: No forecast data found",
        },
      });
    }

    const row = result.rows[0];
    const issuanceDate = row.issuance_date.toLocaleString("en-PH").split(", ")[0];

    const response = {
      metadata: {
        request_no: requestNo,
        api: "Forecast by Date",
        forecast: "10-day Forecast",
        issuance_date: issuanceDate,
        municity: row.municity,
        province: row.province,
        region: row.region || null,
      },
      data: {
        date: row.date.toLocaleString("en-PH").split(", ")[0],
        rainfall_desc: row.rainfall,
        rainfall_total: row.total_rainfall,
        cloud_cover: row.cloud_cover,
        tmean: row.mean,
        tmin: row.min,
        tmax: row.max,
        humidity: row.humidity,
        wind_speed: row.speed,
        wind_direction: row.direction,
      },
      misc: {
        ...baseFooter,
        total_count: 1,
        total_pages: 1,
        status_code: 200,
        description: "OK",
      },
    };

    await redisClient.set(cacheKey, JSON.stringify(response), "EX", 3600);
    console.log("❌ Cache miss - Fetching from database");
    res.json(response);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({
      metadata: {
        api: "Forecast by Date",
        forecast: "10-day Forecast",
      },
      data: {},
      misc: {
        ...baseFooter,
        status_code: 500,
        description: "Internal Server Error",
      },
    });
  }
});

export default router;
