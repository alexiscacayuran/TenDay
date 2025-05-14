import express from "express";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/current", authenticateToken(1), async (req, res) => {
  const { municity, province, page = 1, limit = 10 } = req.query;
  const per_page = parseInt(limit);
  const today = new Date().toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
  const offset = (parseInt(page) - 1) * per_page;

  const timestamp = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }).replace(',', '');

  const metadata = {
    api: "Current Forecast",
    forecast: "10-day Forecast",
  };

  const defaultMisc = {
    version: "1.0",
    timestamp,
    method: req.method,
    status_code: 200,
    description: "OK",
    current_page: parseInt(page),
    per_page,
    total_count: 0,
    total_pages: 0,
  };

  try {
    const { api_ids } = req.user || {};
    const isAuthorized = api_ids?.some((id) => id === 0 || id === 1);

    if (!isAuthorized) {
      return res.status(403).json({
        metadata,
        forecast: [],
        misc: {
          ...defaultMisc,
          status_code: 403,
          description: "Forbidden: Unauthorized API ID"
        }
      });
    }

    const request_no = await logApiRequest(req, 1);
    if (!request_no) {
      return res.status(401).json({
        metadata,
        forecast: [],
        misc: {
          ...defaultMisc,
          status_code: 401,
          description: "Unauthorized: Invalid or expired token"
        }
      });
    }

    let query = `
      WITH total AS (
        SELECT COUNT(*) AS total_count 
        FROM municities AS m
        INNER JOIN date AS d ON m.id = d.municity_id
        WHERE d.date = $1
    `;
    let values = [today];

    if (municity) {
      values.push(`%${municity}%`);
      query += ` AND m.municity ILIKE $${values.length}`;
    }
    if (province) {
      values.push(`%${province}%`);
      query += ` AND m.province ILIKE $${values.length}`;
    }

    query += `)
      SELECT 
        (SELECT total_count FROM total) AS total_count,
        m.id AS location_id, m.municity, m.province, 
        d.id AS date_id, d.date, d.start_date, 
        r.description as rainfall, r.total as total_rainfall,
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
      WHERE d.date = $1`;

    if (municity) query += ` AND m.municity ILIKE $${values.indexOf(`%${municity}%`) + 1}`;
    if (province) query += ` AND m.province ILIKE $${values.indexOf(`%${province}%`) + 1}`;

    query += ` ORDER BY m.province ASC, m.municity ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(per_page, offset);

    const result = await pool.query(query, values);

    // 🧩 Add this block to handle no results
    if (result.rows.length === 0) {
      const request_no = await logApiRequest(req, 1);
      return res.status(204).json({
        metadata: { request_no, ...metadata },
        forecast: [],
        misc: {
          ...defaultMisc,
          status_code: 200,
          description: "No current forecast data found",
        },
      });
    }

    const total_count = result.rows[0]?.total_count || 0;
    const total_pages = Math.ceil(total_count / per_page);
    const issuance_date = result.rows.length > 0
      ? new Date(result.rows[0].start_date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })
      : today;

    const headerData = municity || province
      ? { municity, province, issuance_date }
      : { issuance_date };

    const forecast = [];

    for (const entry of result.rows) {
      const key = `forecast:${entry.location_id}:${entry.date_id}`;
      const forecastData = {
        date: new Date(entry.date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }),
        ...(municity ? {} : { municity: entry.municity }),
        ...(province ? {} : { province: entry.province }),
        rainfall: entry.rainfall,
        total_rainfall: entry.total_rainfall,
        cloud_cover: entry.cloud_cover,
        mean: entry.mean,
        min: entry.min,
        max: entry.max,
        humidity: entry.humidity,
        speed: entry.speed,
        direction: entry.direction,
      };
      await redisClient.hSet(key, forecastData);
      await redisClient.expire(key, 86400);

      forecast.push(forecastData);
    }

    return res.status(200).json({
      metadata: { request_no, ...metadata },
      forecast: [headerData, ...forecast],
      misc: {
        ...defaultMisc,
        total_count,
        total_pages,
        status_code: 200,
        description: "OK"
      }
    });
  } catch (error) {
    console.error("❌ Error executing query:", error);
    return res.status(500).json({
      metadata,
      forecast: [],
      misc: {
        ...defaultMisc,
        status_code: 500,
        description: "Internal Server Error"
      }
    });
  }
});

export default router;
