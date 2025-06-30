import express from "express";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/tenday/current", authenticateToken(1), async (req, res) => {
  let { municity, province, page = "1", limit = "10" } = req.query;

  let per_page = parseInt(limit);
  let current_page = null;

  if (page === "none") {
    current_page = null;
  } else {
    let pageNum = parseInt(page);
    current_page = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  }

  const today = new Date().toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
  const offset = current_page ? (current_page - 1) * per_page : 0;
  const timestamp = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }).replace(',', '');

  const baseMetadata = {
    api: "Current Forecast",
    forecast: "10-day Forecast",
  };

  const defaultMisc = {
    version: "1.0",
    timestamp,
    method: req.method,
    status_code: 200,
    description: "OK"
  };  

  try {
    const { api_ids } = req.user || {};
    const isAuthorized = api_ids?.some((id) => id === 0 || id === 1);

    if (!isAuthorized) {
      return res.status(403).json({
        metadata: baseMetadata,
        data: [],
        misc: {
          ...defaultMisc,
          status_code: 403,
          description: "Forbidden: You are not authorized to access this API.",
        },
      });
    }

    const request_no = await logApiRequest(req, 1);
    if (!request_no) {
      return res.status(401).json({
        metadata: baseMetadata,
        data: [],
        misc: {
          ...defaultMisc,
          status_code: 401,
          description: "Unauthorized: Invalid or expired token",
        },
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
        m.id AS location_id, m.municity, m.province, m.region,
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

    query += ` ORDER BY m.province ASC, m.municity ASC`;

    if (current_page !== null) {
      query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(per_page, offset);
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      if (municity || province) {
        return res.status(400).json({
          metadata: { request_no, ...baseMetadata },
          data: [],
          misc: {
            ...defaultMisc,
            status_code: 400,
            description: "Bad Request: Provided municipality or province not found",
          },
        });
      }

      return res.status(404).json({
        metadata: { request_no, ...baseMetadata },
        data: [],
        misc: {
          ...defaultMisc,
          status_code: 404,
          description: "No content: No current forecast data found",
        },
      });
    }

    const total_count = result.rows[0]?.total_count || 0;
    const total_page = current_page !== null ? Math.ceil(total_count / per_page) : 1;
    const issuance_date = result.rows[0]?.start_date
      ? new Date(result.rows[0].start_date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })
      : today;

    const forecastData = [];

    for (const entry of result.rows) {
      const key = `forecast:${entry.location_id}:${entry.date_id}`;
      const cachedData = await redisClient.hGetAll(key);

      if (cachedData && Object.keys(cachedData).length > 0) {
        forecastData.push({ ...cachedData });
      } else {
        const forecastEntry = {
          date: new Date(entry.date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }),
          ...(municity ? {} : province ? { municity: entry.municity } : {
            municity: entry.municity,
            province: entry.province,
            region: entry.region
          }),
          rainfall_desc: entry.rainfall,
          rainfall_total: entry.total_rainfall,
          cloud_cover: entry.cloud_cover,
          tmean: entry.mean,
          tmin: entry.min,
          tmax: entry.max,
          humidity: entry.humidity,
          wind_speed: entry.speed,
          wind_direction: entry.direction,
        };
        
        await redisClient.hSet(key, forecastEntry);
        await redisClient.expire(key, 86400);
        forecastData.push(forecastEntry);
      }
    }

    let misc;

    if (current_page === null) {
      // Case: page=none → minimalist misc object
      misc = {
        version: "1.0",
        timestamp,
        method: req.method,
        status_code: 200,
        description: "OK"
      };
    } else {
      // Case: default paginated
      misc = {
        version: "1.0",
        timestamp,
        method: req.method,
        current_page,
        per_page,
        total_count,
        total_page,
        status_code: 200,
        description: "OK"
      };
    }

    // Metadata response logic
    const metadata = {
      request_no,
      api: "Current Forecast",
      forecast: "10-day Forecast",
      issuance_date,
    };

    const firstRow = result.rows[0];

    if (municity) {
      metadata.municity = firstRow.municity;
      metadata.province = firstRow.province;
      metadata.region = firstRow.region;
    } else if (province) {
      metadata.province = firstRow.province;
      metadata.region = firstRow.region;
    }

    return res.status(200).json({
      metadata,
      data: (municity && province) ? forecastData[0] : forecastData,
      misc,
    });

  } catch (error) {
    console.error("❌ Error executing query:", error);
    return res.status(500).json({
      metadata: baseMetadata,
      data: [],
      misc: {
        ...defaultMisc,
        status_code: 500,
        description: "Internal Server Error",
      },
    });
  }
});

export default router;
