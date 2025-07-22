import express from "express";
import chalk from "chalk";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";
import Fuse from "fuse.js";

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

router.get("/tenday/date", authenticateToken(4), async (req, res) => {
  const { region, province, municity, date, page } = req.query;
  const isPageNone = page === "none";
  const pageNum = !isPageNone ? parseInt(page || "1") : null;
  const token = req.headers["token"];
  const baseFooter = {
    version: "1.0",
    timestamp: new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }).replace(",", ""),
    method: "GET"
  };

  if (!isPageNone) {
    baseFooter.current_page = pageNum;
    baseFooter.per_page = 10;
    baseFooter.total_count = 0;
    baseFooter.total_pages = 0;
  }

  try {
    const tokenResult = await pool.query(`SELECT api_ids FROM api_tokens WHERE token = $1 LIMIT 1`, [token]);
    if (!tokenResult.rows.length || !tokenResult.rows[0].api_ids.includes(4)) {
      return res.status(403).json({
        metadata: { api: "Forecast by Date" },
        data: {},
        misc: { ...baseFooter, status_code: 403, description: "Forbidden: You are not authorized to access this API." }
      });
    }

    const requestNo = await logApiRequest(req, 4);

    if (!date) {
      return res.status(400).json({
        metadata: { api: "Forecast by Date" },
        data: {},
        misc: { ...baseFooter, status_code: 400, description: "Bad Request: Provided date, municipality, province, or region not found" }
      });
    }

    const refRows = (await pool.query(`
      SELECT DISTINCT 
        municity, province, region, 
        m_old AS "muniOld", p_old AS "provOld"
      FROM municities
    `)).rows;

    const fuseOptions = {
      location: 8,
      threshold: 0.6,
      distance: 30,
      isCaseSensitive: false,
      includeScore: true,
      ignoreDiacritics: true,
      keys: ["municity", "province", "muniOld", "provOld"]
    };

    const fuse = new Fuse(refRows, fuseOptions);
    const values = [];
    const filters = [];

    // DATE filter
    values.push(date);
    filters.push(`TO_CHAR(d.date, 'MM-DD-YYYY') = $${values.length}`);

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

    const offset = (pageNum - 1) * 10;
    const limitClause = isPageNone ? "" : `LIMIT 10 OFFSET ${offset}`;
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const query = `
      SELECT m.municity, m.province, m.region, d.date, d.start_date AS issuance_date,
             r.total AS total_rainfall, r.description AS rainfall,
             c.description AS cloud_cover, t.mean, t.min, t.max,
             h.mean AS humidity, w.speed, w.direction
      FROM municities m
      JOIN date d ON m.id = d.municity_id
      JOIN rainfall r ON d.id = r.date_id
      JOIN cloud_cover c ON d.id = c.date_id
      JOIN temperature t ON d.id = t.date_id
      JOIN humidity h ON d.id = h.date_id
      JOIN wind w ON d.id = w.date_id
      ${whereClause}
      ORDER BY m.province, m.municity
      ${limitClause}`;

    const result = await pool.query(query, values);

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM municities m
      JOIN date d ON m.id = d.municity_id
      ${whereClause}`, values);

    if (!result.rows.length) {
      return res.status(404).json({
        metadata: { request_no: requestNo, api: "Forecast by Date", forecast: "10-day Forecast" },
        data: [],
        misc: { ...baseFooter, status_code: 404, description: "No content: No current forecast data found" }
      });
    }

    const first = result.rows[0];
    const formattedDate = new Date(first.date).toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
    const issuanceDate = new Date(first.issuance_date).toLocaleDateString("en-US", { timeZone: "Asia/Manila" });

    const metadata = {
      request_no: requestNo,
      api: "Forecast by Date",
      forecast: "10-day Forecast",
      issuance_date: issuanceDate,
      date: formattedDate
    };

    if (municity) {
      metadata.region = first.region;
      metadata.province = first.province;
      metadata.municity = first.municity;
    } else if (province) {
      metadata.region = first.region;
      metadata.province = first.province;
    } else if (region) {
      metadata.region = first.region;
    }

    let data;
    if (municity) {
      data = {
        rainfall_desc: first.rainfall,
        rainfall_total: first.total_rainfall,
        cloud_cover: first.cloud_cover,
        tmean: first.mean,
        tmin: first.min,
        tmax: first.max,
        humidity: first.humidity,
        wind_speed: first.speed,
        wind_direction: first.direction
      };
    } else if (province) {
      data = result.rows.map(r => ({
        municity: r.municity,
        rainfall_desc: r.rainfall,
        rainfall_total: r.total_rainfall,
        cloud_cover: r.cloud_cover,
        tmean: r.mean,
        tmin: r.min,
        tmax: r.max,
        humidity: r.humidity,
        wind_speed: r.speed,
        wind_direction: r.direction
      }));
    } else if (region) {
      data = result.rows.map(r => ({
        province: r.province,
        municity: r.municity,
        rainfall_desc: r.rainfall,
        rainfall_total: r.total_rainfall,
        cloud_cover: r.cloud_cover,
        tmean: r.mean,
        tmin: r.min,
        tmax: r.max,
        humidity: r.humidity,
        wind_speed: r.speed,
        wind_direction: r.direction
      }));
    }

    const misc = isPageNone
      ? { ...baseFooter, status_code: 200, description: "OK" }
      : {
          ...baseFooter,
          total_count: parseInt(countResult.rows[0].count, 10),
          total_pages: Math.ceil(countResult.rows[0].count / 10),
          status_code: 200,
          description: "OK"
        };

    const response = { metadata, data, misc };
    const cacheKey = `dateForecast:${token}:${region}:${province}:${municity}:${date}`;
    await redisClient.set(cacheKey, JSON.stringify(response), "EX", 3600);
    return res.json(response);
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).json({
      metadata: { api: "Forecast by Date" },
      data: {},
      misc: { ...baseFooter, status_code: 500, description: "Internal Server Error" }
    });
  }
});

export default router;
