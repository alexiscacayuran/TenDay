import express from "express";
import chalk from "chalk";
import Fuse from "fuse.js";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

const regionMap = {
  "1": "Ilocos Region (Region I)", "i": "Ilocos Region (Region I)",
  "2": "Cagayan Valley (Region II)", "ii": "Cagayan Valley (Region II)",
  "3": "Central Luzon (Region III)", "iii": "Central Luzon (Region III)",
  "4a": "CALABARZON (Region IV-A)", "iva": "CALABARZON (Region IV-A)",
  "4b": "MIMAROPA (Region IV-B)", "ivb": "MIMAROPA (Region IV-B)",
  "5": "Bicol Region (Region V)", "v": "Bicol Region (Region V)",
  "6": "Western Visayas (Region VI)", "vi": "Western Visayas (Region VI)",
  "7": "Central Visayas (Region VII)", "vii": "Central Visayas (Region VII)",
  "8": "Eastern Visayas (Region VIII)", "viii": "Eastern Visayas (Region VIII)",
  "9": "Zamboanga Peninsula (Region IX)", "ix": "Zamboanga Peninsula (Region IX)",
  "10": "Northern Mindanao (Region X)", "x": "Northern Mindanao (Region X)",
  "11": "Davao Region (Region XI)", "xi": "Davao Region (Region XI)",
  "12": "SOCCSKSARGEN (Region XII)", "xii": "SOCCSKSARGEN (Region XII)",
  "13": "Caraga (Region XIII)", "xiii": "Caraga (Region XIII)",
  "ncr": "National Capital Region (NCR)",
  "car": "Cordillera Administrative Region (CAR)",
  "barmm": "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
  "nir": "Negros Island Region (Region XVIII)"
};

router.get("/tenday/full", authenticateToken(2), async (req, res) => {
  const { municity, province, region, page = "1", limit = "10" } = req.query;
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
    description: "Bad Request: municity, province, or region param is required",
  };

  if (!municity && !province && !region) {
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
      SELECT DISTINCT ON (d.date, m.id)
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

      const refRows = (await pool.query(`
        SELECT DISTINCT 
          municity, province, region, 
          m_old AS "muniOld", p_old AS "provOld"
        FROM municities
      `)).rows;    
    
      const fuseOptions = {
        location: 8,
        threshold: 0.4,
        distance: 30,
        isCaseSensitive: false,
        includeScore: true,
        ignoreDiacritics: true,
        keys: ["municity", "province", "muniOld", "provOld"]
      };    
    
      const fuse = new Fuse(refRows, fuseOptions);
    
      const values = [];
      const filters = [];
    
      if (municity) {
        const match = fuse.search(municity).at(0);
        const bestMatch = match?.item?.municity ?? municity;
    
        values.push(bestMatch);
        filters.push(`(
          REGEXP_REPLACE(m.municity, ' CITY', '', 'gi') ILIKE '%' || REGEXP_REPLACE($${values.length}, ' CITY', '', 'gi') || '%' OR
          m.m_psgc ILIKE '%' || $${values.length} || '%'
        )`);
      }
    
      if (province) {
        const match = fuse.search(province).at(0);
        const bestMatch = match?.item?.province ?? province;
    
        values.push(bestMatch);
        filters.push(`(
          m.province ILIKE '%' || $${values.length} || '%' OR
          m.p_psgc ILIKE '%' || $${values.length} || '%'
        )`);
      }
    
      if (region) {
        const inputKey = region.toLowerCase().replace(/\s/g, '');
        const regionInput = regionMap[inputKey] ?? region;
        const match = fuse.search(regionInput).at(0);
        const bestMatch = match?.item?.region ?? regionInput;
    
        values.push(bestMatch);
        filters.push(`(
          m.region ILIKE '%' || $${values.length} || '%' OR
          m.r_psgc ILIKE '%' || $${values.length} || '%'
        )`);
      }
  

    if (filters.length > 0) {
      query += ` AND ${filters.join(" AND ")}`;
    }

    query += ` ORDER BY d.date ASC, m.id ASC, m.province ASC, m.municity ASC`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(400).json({
        metadata: {
          request_no: requestId,
          ...baseMetadata,
          ...(municity ? { municity } : {}),
          ...(province ? { province } : {}),
          ...(region ? { region } : {}),
        },
        data: [],
        misc: {
          version: "1.0",
          timestamp,
          method: "GET",
          status_code: 400,
          description: "Bad Request: Provided municipality, province, or region not found"
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

    // group by municity
    const groupedForecast = {};
    result.rows.forEach((row) => {
      const mname = row.municity;
      if (!groupedForecast[mname]) groupedForecast[mname] = [];
    
      const baseData = {
        date: new Date(row.date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }),
      };
    
      // ⬇️ Data field logic based on params
      if (region && !province && !municity) {
        baseData.province = row.province;
        baseData.municity = row.municity;
      } else if (province && !municity) {
        baseData.municity = row.municity;
      }
      // ✅ Do NOT add municity/province if municity param is present
    
      Object.assign(baseData, {
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
    
      groupedForecast[mname].push(baseData);
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
      if (current_page > total_page) paginatedData = [];
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
    };
    
    // ⬇️ Metadata logic based on params
    if (region && !province && !municity) {
      metadata.region = first.region;
    } else if (province && !municity) {
      metadata.region = first.region;
      metadata.province = first.province;
    } else if (municity) {
      metadata.region = first.region;
      metadata.province = first.province;
      metadata.municity = first.municity;
    }
    


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
