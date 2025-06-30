import express from "express";
import chalk from "chalk";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/tenday/full", authenticateToken(2), async (req, res) => {
  const { municity, province, page = "1", limit = "10" } = req.query;
  const timestamp = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }).replace(",", "");

  const baseMetadata = {
    api: "Full Forecast",
    forecast: "10-day Forecast",
  };

  const defaultMisc = {
    version: "1.0",
    timestamp,
    method: "GET",
    status_code: 400,
    description: "Bad Request: municity or province param is required",
  };

  if (!municity && !province) {
    return res.status(400).json({
      metadata: baseMetadata,
      data: [],
      misc: defaultMisc,
    });
  }

  const { api_ids } = req.user || {};
  const isAuthorized = api_ids?.some((id) => id === 0 || id === 2);

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

  try {
    const requestId = await logApiRequest(req, 2);

    let query = `
      SELECT 
        m.id AS location_id, m.municity, m.province, m.region,
        d.date, d.start_date,
        r.description AS rainfall, r.total AS total_rainfall,
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
      WHERE d.start_date = (
        SELECT MAX(start_date) FROM date
      )`;

    const values = [];
    let filters = [];

    if (municity) {
      values.push(municity);
      filters.push(`REGEXP_REPLACE(m.municity, ' CITY', '', 'gi') ILIKE '%' || REGEXP_REPLACE($${values.length}, ' CITY', '', 'gi') || '%'`);
    }

    if (province) {
      values.push(province);
      filters.push(`m.province ILIKE '%' || $${values.length} || '%'`);
    }

    if (filters.length > 0) {
      query += ` AND ${filters.join(" AND ")}`;
    }

    query += ` ORDER BY m.municity ASC, d.date ASC`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(400).json({
        metadata: {
          request_no: requestId,
          ...baseMetadata,
          ...(municity ? { municity } : {}),
          ...(province ? { province } : {}),
        },
        data: [],
        misc: {
          version: "1.0",
          timestamp,
          method: "GET",
          status_code: 400,
          description: "Bad Request: Provided municipality or province not found"
        }
      });
    }

    const first = result.rows[0];
    const issuance_date = new Date(first.start_date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
    const start_date = new Date(first.start_date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
    const end_date = new Date(result.rows[result.rows.length - 1].date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });

    let current_page = null;
    const per_page = parseInt(limit);

    if (page !== "none") {
      const parsedPage = parseInt(page);
      current_page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    }

    // group data per municity
    const groupedForecast = {};

    result.rows.forEach((row) => {
      const mname = row.municity;
      if (!groupedForecast[mname]) groupedForecast[mname] = [];

      groupedForecast[mname].push({
        ...(province && !municity ? { municity: row.municity } : {}),
        date: new Date(row.date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }),
        rainfall_desc: row.rainfall,
        rainfall_total: row.total_rainfall,
        cloud_cover: row.cloud_cover,
        tmean: row.mean,
        tmin: row.min,
        tmax: row.max,
        humidity: row.humidity,
        wind_speed: row.speed,
        wind_direction: row.direction,
      });
    });

    let fullData = Object.values(groupedForecast).flat();

    const total_count = fullData.length;
    let total_page = 1;
    let paginatedData = fullData;

    if (current_page !== null) {
      total_page = Math.ceil(total_count / per_page);
      const start = (current_page - 1) * per_page;
      const end = start + per_page;
      paginatedData = fullData.slice(start, end);

      if (current_page > total_page) {
        paginatedData = [];
      }
    }

    const misc = {
      version: "1.0",
      timestamp,
      method: "GET",
      ...(current_page !== null && {
        current_page,
        per_page,
        total_count,
        total_page,
      }),
      status_code: 200,
      description: "OK",
    };    

    const metadata = {
      request_no: requestId,
      api: baseMetadata.api,
      forecast: baseMetadata.forecast,
      issuance_date,
      start_date,
      end_date,
      ...(municity && province
        ? { municity: first.municity, province: first.province, region: first.region }
        : province
        ? { province: first.province, region: first.region }
        : municity
        ? { municity: first.municity, province: first.province, region: first.region }
        : {}),
    };

    return res.status(200).json({
      metadata,
      data: paginatedData,
      misc,
    });
  } catch (error) {
    console.error("❌ Error executing forecast query", error.stack);
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
