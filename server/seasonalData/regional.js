import express from "express";
import { pool } from "../db.js";
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

const valueLabel = {
  mm: "Rainfall (mm)",
  pn: "Percent Normal",
  all: "Rainfall + Percent Normal"
};

router.get("/region", authenticateToken(7), async (req, res) => {
  const request_id = await logApiRequest(req, 7);
  const {
    region,
    value = "mm",
    issuance_date,
    batch,
    page = 1,
    per_page = 10
  } = req.query;

  const normalizedRegion = region?.toLowerCase();
  const regionName = regionMap[normalizedRegion];

  const misc = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    method: "GET",
    status_code: 200,
    description: "OK",
    current_page: parseInt(page),
    per_page: parseInt(per_page),
    total_count: 0,
    total_pages: 0
  };

  if (!regionName) {
    return res.status(400).json({
      metadata: {
        api: "Regional Forecast",
        forecast: valueLabel[value] || value
      },
      forecast: [],
      misc: { ...misc, status_code: 400, description: "Invalid region parameter" }
    });
  }

  try {
    const provinces = await pool.query(
      `SELECT id, name FROM province WHERE region = $1 AND id < 84 ORDER BY name ASC`,
      [regionName]
    );

    const provinceIds = provinces.rows.map(p => p.id);
    const total_count = provinceIds.length;
    const total_pages = Math.ceil(total_count / per_page);
    const offset = (page - 1) * per_page;
    const paginatedProvinces = provinceIds.slice(offset, offset + parseInt(per_page));

    let baseDate = null;
    let effectiveStartMonthLabel = null;

    // Determine global base date
    if (issuance_date) {
      const [mm, yyyy] = issuance_date.split("/").map(str => parseInt(str));
      baseDate = baseDate = dayjs(`${yyyy}-${mm.toString().padStart(2, "0")}-01`).add(1, "month");
      effectiveStartMonthLabel = baseDate.subtract(1, "month").format("MMMM YYYY");
    } else if (batch) {
      // Pick any province for batch date lookup
      const anyProvince = provinceIds[0];
      const first = await pool.query(
        `SELECT date FROM sf_date WHERE province_id = $1 AND batch = $2 ORDER BY date ASC LIMIT 1`,
        [anyProvince, batch]
      );
      if (first.rows.length > 0) {
        baseDate = dayjs(first.rows[0].date);
        effectiveStartMonthLabel = baseDate.subtract(1, "month").format("MMMM YYYY");
      }
    }

    let forecast = [];

    for (const province_id of paginatedProvinces) {
      const provinceInfo = provinces.rows.find(p => p.id === province_id);
      if (!provinceInfo) continue;

      let dates = [];

      if (baseDate) {
        const result = await pool.query(
          `SELECT id, date FROM sf_date WHERE province_id = $1 AND date >= $2 ORDER BY date ASC LIMIT 6`,
          [province_id, baseDate.toISOString()]
        );
        dates = result.rows;
      }

      const data = [];

      for (const row of dates) {
        const date_id = row.id;
        const label = dayjs(row.date).format("MMMM YYYY");

        const rf = await pool.query(`SELECT mean, min, max FROM forecast_rf WHERE date_id = $1`, [date_id]);
        const pn = await pool.query(`SELECT mean, description FROM percent_n WHERE date_id = $1`, [date_id]);

        const rain = rf.rows[0] || {};
        const percent = pn.rows[0] || {};

        data.push({
          month: label,
          ...(value === "mm" || value === "all" ? {
            min_mm: rain.min ? parseFloat(rain.min) : null,
            max_mm: rain.max ? parseFloat(rain.max) : null,
            mean_mm: rain.mean ? parseFloat(rain.mean) : null
          } : {}),
          ...(value === "pn" || value === "all" ? {
            percent_normal: percent.mean ? parseFloat(percent.mean) : null,
            description: percent.description || null
          } : {})
        });
      }

      forecast.push({
        province: provinceInfo.name,
        data
      });
    }

    misc.total_count = total_count;
    misc.total_pages = total_pages;

    return res.status(200).json({
      metadata: {
        api: "Regional Forecast",
        forecast: "Seasonal Forecast",
        region: regionName,
        issuance_month: effectiveStartMonthLabel
      },
      forecast,
      misc
    });

  } catch (error) {
    console.error("❌ Regional Forecast Error:", error);
    return res.status(500).json({
      metadata: {
        api: "Regional Forecast",
        forecast: valueLabel[value] || value
      },
      forecast: [],
      misc: { ...misc, status_code: 500, description: "Internal Server Error" }
    });
  }
});

export default router;
