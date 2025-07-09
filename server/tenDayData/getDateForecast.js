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

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove diacritics like ñ
    .replace(/ñ/g, "n")
    .replace(/^city of\s+/i, "")
    .replace(/^city\s+/i, "")
    .replace(/\s+city$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}


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

    const refQuery = await pool.query("SELECT municity, province, region FROM municities");
    const refRows = refQuery.rows.map(row => ({
      ...row,
      normalized_municity: normalizeName(row.municity),
      normalized_province: normalizeName(row.province),
      normalized_region: normalizeName(row.region)
    }));
    
    const fuseOptions = {
      isCaseSensitive: false,
      includeScore: false,
      threshold: 0.6,
      distance: 100,
      minMatchCharLength: 1,
      shouldSort: true,
      keys: ["normalized_municity", "normalized_province", "normalized_region"]
    };
    
    const fuse = new Fuse(refRows, fuseOptions);    

    let where = [`d.date = $1`];
    let values = [date];
    let i = 2;

    let matched;

    if (municity) {
      const norm = normalizeName(municity);
      const searchResults = fuse.search(normalizeName(municity));
      const bestMatch = searchResults.length ? searchResults[0].item.municity : municity;
      
      where.push(`(
        REGEXP_REPLACE(LOWER(m.municity), ' city', '', 'gi') ILIKE '%' || REGEXP_REPLACE(LOWER($${i}), ' city', '', 'gi') || '%'
        OR m.m_psgc ILIKE '%' || $${i} || '%'
      )`);
      values.push(bestMatch);      
      i++;
    }
    
    if (province) {
      const norm = normalizeName(province);
      matched = fuse.search(norm).find(x => normalizeName(x.item.province) === norm);
      const bestMatch = matched?.item?.province ?? province;
      where.push(`(m.province = $${i} OR m.p_psgc = $${i})`);
      values.push(bestMatch);
      i++;
    }
    
    if (region) {
      const regKey = normalizeName(region);
      const mapped = regionMap[regKey] || region;
      matched = fuse.search(mapped).find(x => normalizeName(x.item.region) === normalizeName(mapped));
      const bestMatch = matched?.item?.region ?? mapped;
      where.push(`(m.region = $${i} OR m.r_psgc = $${i})`);
      values.push(bestMatch);
      i++;
    }
    

    const offset = (pageNum - 1) * 10;
    const limitClause = isPageNone ? "" : `LIMIT 10 OFFSET ${offset}`;

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
      WHERE ${where.join(" AND ")}
      ORDER BY m.province, m.municity
      ${limitClause}`;

    const result = await pool.query(query, values);
    const fullCount = await pool.query(`
      SELECT COUNT(*) FROM municities m
      JOIN date d ON m.id = d.municity_id
      WHERE ${where.join(" AND ")}`, values);

    if (!result.rows.length) return res.status(404).json({ metadata: { request_no: requestNo, api: "Forecast by Date", forecast: "10-day Forecast" }, data: [], misc: { ...baseFooter, status_code: 404, description: "No content: No current forecast data found" } });

    const first = result.rows[0];
    const metadata = {
      request_no: requestNo,
      api: "Forecast by Date",
      forecast: "10-day Forecast",
      issuance_date: first.issuance_date.toLocaleString("en-PH").split(",")[0],
      date: first.date.toLocaleString("en-PH").split(",")[0]
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

    const misc = isPageNone ? {
      ...baseFooter,
      status_code: 200,
      description: "OK"
    } : {
      ...baseFooter,
      total_count: parseInt(fullCount.rows[0].count, 10),
      total_pages: Math.ceil(fullCount.rows[0].count / 10),
      status_code: 200,
      description: "OK"
    };

    const response = { metadata, data, misc };

    const cacheKey = `dateForecast:${token}:${region}:${province}:${municity}:${date}`;
    await redisClient.set(cacheKey, JSON.stringify(response), "EX", 3600);
    return res.json(response);
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).json({ metadata: { api: "Forecast by Date" }, data: {}, misc: { ...baseFooter, status_code: 500, description: "Internal Server Error" } });
  }
});

export default router;
