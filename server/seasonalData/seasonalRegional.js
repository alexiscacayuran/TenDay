import express from "express";
import { pool, redisClient } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

// Region Mapping
const regionMap = {
  "i": "Ilocos Region (Region I)",
  "ii": "Cagayan Valley (Region II)",
  "iii": "Central Luzon (Region III)",
  "iva": "CALABARZON (Region IV-A)",
  "ivb": "MIMAROPA (Region IV-B)",
  "v": "Bicol Region (Region V)",
  "vi": "Western Visayas (Region VI)",
  "vii": "Central Visayas (Region VII)",
  "viii": "Eastern Visayas (Region VIII)",
  "ix": "Zamboanga Peninsula (Region IX)",
  "x": "Northern Mindanao (Region X)",
  "xi": "Davao Region (Region XI)",
  "xii": "SOCCSKSARGEN (Region XII)",
  "xiii": "Caraga (Region XIII)",
  "car": "Cordillera Administrative Region (CAR)",
  "armm": "Autonomous Region of Muslim Mindanao (ARMM)",
  "ncr": "National Capital Region (NCR)",
  "1": "Ilocos Region (Region I)",
  "2": "Cagayan Valley (Region II)",
  "3": "Central Luzon (Region III)",
  "4a": "CALABARZON (Region IV-A)",
  "4b": "MIMAROPA (Region IV-B)",
  "5": "Bicol Region (Region V)",
  "6": "Western Visayas (Region VI)",
  "7": "Central Visayas (Region VII)",
  "8": "Eastern Visayas (Region VIII)",
  "9": "Zamboanga Peninsula (Region IX)",
  "10": "Northern Mindanao (Region X)",
  "11": "Davao Region (Region XI)",
  "12": "SOCCSKSARGEN (Region XII)",
  "13": "Caraga (Region XIII)",
};

router.get("/regSeasonal", authenticateToken(7), async (req, res) => {
  try {
    const api_id = 7;
    await logApiRequest(req, api_id); // 📝 Log API usage

    const { region, value, month, year } = req.query;
    console.log("Received query:", req.query);

    if (!region || !value || !month || !year) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const regionName = regionMap[region.toLowerCase()];
    if (!regionName) {
      return res.status(400).json({ error: "Invalid region code" });
    }
    console.log("Resolved region name:", regionName);

    const cacheKey = `seasonal:${region}:${value}:${month}:${year}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit");
      return res.json(JSON.parse(cachedData));
    }
    console.log("Cache miss, querying database");

    const provinceQuery = `SELECT id, name FROM province WHERE region = $1`;
    const provinceResult = await pool.query(provinceQuery, [regionName]);
    const provinceIds = provinceResult.rows.map(row => row.id);
    const provinceMap = Object.fromEntries(provinceResult.rows.map(row => [row.id, row.name]));

    console.log(`Provinces found: ${provinceIds.length}`);

    if (provinceIds.length === 0) {
      return res.status(404).json({ error: "No provinces found for the region" });
    }

    const startMonth = parseInt(month, 10);
    const startYear = parseInt(year, 10);
    const selectedDates = [];

    for (let i = 0; i < 6; i++) {
      const monthIndex = startMonth - 1 + i;
      const yearOffset = Math.floor(monthIndex / 12);
      const monthCorrected = (monthIndex % 12) + 1;
      const yearCorrected = startYear + yearOffset;
      const monthStr = String(monthCorrected).padStart(2, '0');
      selectedDates.push(`${yearCorrected}-${monthStr}-01`);
    }

    console.log("Selected dates:", selectedDates);

    const dateQuery = `
      SELECT id, date, province_id
      FROM sf_date
      WHERE date = ANY($1)
      AND province_id = ANY($2)
      ORDER BY date ASC
    `;
    const dateResult = await pool.query(dateQuery, [selectedDates, provinceIds]);
    console.log("Matching sf_date rows:", dateResult.rowCount);

    if (dateResult.rows.length === 0) {
      return res.status(404).json({ error: "No seasonal data found for the given months." });
    }

    const dateIds = dateResult.rows.map(row => row.id);
    const dateMap = Object.fromEntries(dateResult.rows.map(row => [row.id, {
      date: row.date,
      province: provinceMap[row.province_id]
    }]));

    let dataQuery, dataValues;

    if (value === "mm") {
      dataQuery = `
        SELECT f.mean AS mean_mm, f.max AS max_mm, f.min AS min_mm, d.id AS date_id, prov.name AS province
        FROM forecast_rf f
        JOIN sf_date d ON f.date_id = d.id
        JOIN province prov ON d.province_id = prov.id
        WHERE d.id = ANY($1)
        ORDER BY d.date ASC, prov.name ASC
      `;
      dataValues = [dateIds];
    } else if (value === "pn") {
      dataQuery = `
        SELECT p.mean AS percent_normal, f.mean AS mean_mm, p.description, d.id AS date_id, prov.name AS province
        FROM percent_n p
        JOIN forecast_rf f ON p.date_id = f.date_id
        JOIN sf_date d ON f.date_id = d.id
        JOIN province prov ON d.province_id = prov.id
        WHERE d.id = ANY($1)
        ORDER BY d.date ASC, prov.name ASC
      `;
      dataValues = [dateIds];
    } else if (value === "all") {
      dataQuery = `
        SELECT d.id AS date_id, d.date, 
               p.mean AS percent_normal, f.mean AS mean_mm, 
               f.max AS max_mm, f.min AS min_mm, 
               p.description, prov.name AS province
        FROM sf_date d
        LEFT JOIN forecast_rf f ON d.id = f.date_id
        LEFT JOIN percent_n p ON d.id = p.date_id
        LEFT JOIN province prov ON d.province_id = prov.id
        WHERE d.id = ANY($1)
        ORDER BY d.date ASC, prov.name ASC
      `;
      dataValues = [dateIds];
    } else {
      return res.status(400).json({ error: "Invalid value parameter" });
    }

    const dataResult = await pool.query(dataQuery, dataValues);
    console.log(`Data rows returned: ${dataResult.rowCount}`);

    const formattedData = dataResult.rows.map(row => {
      const dateObj = new Date(dateMap[row.date_id].date);
      const year = dateObj.getFullYear();
      const month = dateObj.toLocaleString("default", { month: "short" });

      let result = {
        province: dateMap[row.date_id].province,
        month,
        year
      };

      if (row.mean_mm !== null) result.mean_mm = row.mean_mm;
      if (row.max_mm !== null) result.max_mm = row.max_mm;
      if (row.min_mm !== null) result.min_mm = row.min_mm;
      if (row.percent_normal !== null) result.percent_normal = row.percent_normal;
      if (row.description !== null) result.description = row.description;

      return result;
    }).filter(entry => Object.keys(entry).length > 3);

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(formattedData));
    res.json(formattedData);

  } catch (error) {
    console.error("Error in /regSeasonal:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
