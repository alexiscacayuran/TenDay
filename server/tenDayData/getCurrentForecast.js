import express from "express";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/current", authenticateToken, async (req, res) => {
  const { municity, province, page = 1, limit = 10 } = req.query;
  const per_page = parseInt(limit);
  const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
  const offset = (parseInt(page) - 1) * per_page;
  const cacheKey = `current:${municity || "all"}:${province || "all"}:${today}:page:${page}`;

  console.log("🔍 Token from Middleware:", req.user);

  const { api_ids } = req.user; // Extract api_ids array from decoded token
  console.log("✅ API IDs from Token:", api_ids);

  // ✅ Check if ANY api_id in the token is 0 or 1
  const isAuthorized = api_ids.some(id => id === 0 || id === 1);
  if (!isAuthorized) {
    console.log("❌ Unauthorized API IDs:", api_ids);
    return res.status(403).json({ error: "Forbidden: Unauthorized API ID" });
  }

  try {
    const request_no = await logApiRequest(req, 1);
    if (!request_no) {
      return res.status(403).json({ error: "Invalid API token" });
    }

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
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
    const total_count = result.rows[0]?.total_count || 0;
    const total_pages = Math.ceil(total_count / per_page);

    const issuance_date = result.rows.length > 0
      ? new Date(result.rows[0].start_date).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })
      : today;

    let metadata = {
      request_no,
      api: "Current Forecast",
      forecast: "10-day Forecast",
    };

    let misc = {
      version: "1.0",
      total_count,
      total_pages,
      current_page: parseInt(page),
      per_page,
      timestamp: new Date().toLocaleString('en-CA', { timeZone: 'Asia/Manila' }).replace(',', ''),
      method: req.method,
      status_code: 200,
      description: "OK",
    };

    let headerData = {};
    if (municity || province) {
      headerData = { municity, province, issuance_date };
    } else {
      headerData = { issuance_date };
    }

    const responseData = result.rows.map(entry => ({
      location_id: entry.location_id,
      date_id: entry.date_id,
      date: new Date(entry.date).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' }),
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
    }));

    const finalResponse = {
      metadata,
      forecast: [headerData, ...responseData],
      misc
    };

    await redisClient.set(cacheKey, JSON.stringify(finalResponse), { EX: 864000 });
    return res.json(finalResponse);
  } catch (error) {
    console.error("❌ Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
