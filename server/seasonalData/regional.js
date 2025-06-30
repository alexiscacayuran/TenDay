import express from "express";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";
import dayjs from "dayjs";

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
  "armm": "Autonomous Region of Muslim Mindanao (ARMM)"
};

router.get("/region", authenticateToken(), async (req, res) => {
  await logApiRequest(req, 7);

  const {
    region,
    value = "mm",
    page = "1",
    per_page = "10"
  } = req.query;

  const { api_ids } = req.user;
  const isPageNone = page === "none";
  const currentPage = isPageNone ? null : parseInt(page) || 1;
  const pageLimit = isPageNone ? null : parseInt(per_page) || 10;
  const timestamp = dayjs().format("M/D/YYYY h:mm:ss A");

  if (!Array.isArray(api_ids) || !api_ids.includes(7)) {
    return res.status(403).json({
      metadata: {
        api: "Regional Forecast",
        forecast: "Seasonal Forecast"
      },
      data: [],
      misc: {
        version: "1.0",
        timestamp,
        method: "GET",
        current_page: currentPage,
        per_page: pageLimit,
        total_count: 0,
        total_pages: 0,
        status_code: 403,
        description: "Forbidden: You are not authorized to access this API."
      }
    });
  }

  const normalizedRegion = region?.toLowerCase();
  const regionName = regionMap[normalizedRegion];

  if (region && !regionName) {
    return res.status(400).json({
      metadata: {
        api: "Regional Forecast",
        forecast: "Seasonal Forecast"
      },
      data: [],
      misc: {
        version: "1.0",
        timestamp,
        method: "GET",
        status_code: 404,
        description: "Bad Request: Invalid region parameter"
      }
    });
  }

  // Cache key based on params
  const cacheKey = `forecast:region:${region || "all"}:value:${value}:page:${page}:limit:${per_page}`;

  try {
    // Try to fetch from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.misc.timestamp = timestamp; // update live timestamp
      return res.json(parsed);
    }

    const provinceQuery = regionName
      ? `SELECT id, name, region FROM province WHERE region = $1 AND id < 84 ORDER BY name ASC`
      : `SELECT id, name, region FROM province WHERE id < 84 ORDER BY name ASC`;

    const provinces = await pool.query(provinceQuery, regionName ? [regionName] : []);
    const provinceIds = provinces.rows.map(p => p.id);
    const total_count = provinceIds.length;
    const total_pages = isPageNone ? 1 : Math.ceil(total_count / pageLimit);
    const offset = isPageNone ? 0 : (currentPage - 1) * pageLimit;
    const paginatedProvinces = isPageNone
      ? provinceIds
      : provinceIds.slice(offset, offset + pageLimit);

    const batchRes = await pool.query("SELECT MAX(batch) AS batch FROM sf_date");
    const maxBatch = batchRes.rows[0]?.batch;

    const dateRes = await pool.query("SELECT MIN(date) AS date FROM sf_date WHERE batch = $1", [maxBatch]);
    const baseDate = dayjs(dateRes.rows[0]?.date);
    const issuance_month = baseDate.subtract(1, "month").format("MMMM YYYY");
    const start_month = baseDate.format("MMMM YYYY");
    const end_month = baseDate.add(5, "month").format("MMMM YYYY");

    const data = [];

    for (const province_id of paginatedProvinces) {
      const prov = provinces.rows.find(p => p.id === province_id);
      const result = await pool.query(
        `SELECT id, date FROM sf_date WHERE province_id = $1 AND batch = $2 ORDER BY date ASC LIMIT 6`,
        [province_id, maxBatch]
      );

      for (const row of result.rows) {
        const date_id = row.id;
        const label = dayjs(row.date).format("MMMM YYYY");

        const rf = await pool.query(`SELECT mean, min, max FROM forecast_rf WHERE date_id = $1`, [date_id]);
        const pn = await pool.query(`SELECT mean, description FROM percent_n WHERE date_id = $1`, [date_id]);

        const rain = rf.rows[0] || {};
        const percent = pn.rows[0] || {};

        data.push({
          month: label,
          province: prov.name,
          region: prov.region,
          ...(value === "mm" || value === "all" || value === "pn" ? {
            mean_mm: rain.mean ? parseFloat(rain.mean) : null
          } : {}),
          ...(value === "mm" || value === "all" ? {
            min_mm: rain.min ? parseFloat(rain.min) : null,
            max_mm: rain.max ? parseFloat(rain.max) : null
          } : {}),
          ...(value === "pn" || value === "all" ? {
            percent_normal: percent.mean ? parseFloat(percent.mean) : null,
            description: percent.description || null
          } : {})
        });
      }
    }

    const metadata = {
      api: "Regional Forecast",
      forecast: "Seasonal Forecast",
      issuance_month,
      start_month,
      end_month,
      ...(regionName ? { region: regionName } : {})
    };

    const misc = isPageNone
      ? {
          version: "1.0",
          timestamp,
          method: "GET",
          status_code: 200,
          description: "OK"
        }
      : {
          version: "1.0",
          timestamp,
          method: "GET",
          current_page: currentPage,
          per_page: pageLimit,
          total_count,
          total_pages,
          status_code: 200,
          description: "OK"
        };

    const finalResult = {
      metadata,
      data,
      misc
    };

    // Save to Redis (expire after 10 mins)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(finalResult));

    return res.json(finalResult);

  } catch (error) {
    console.error("❌ Regional Forecast Error:", error);
    return res.status(500).json({
      metadata: {
        api: "Regional Forecast",
        forecast: "Seasonal Forecast"
      },
      data: [],
      misc: {
        version: "1.0",
        timestamp,
        method: "GET",
        status_code: 500,
        description: "Internal Server Error"
      }
    });
  }
});

export default router;
