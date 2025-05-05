import express from "express";
import { pool, redisClient } from "../db.js";

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

router.get("/", async (req, res) => {
  try {
    const { region, value, month, year } = req.query;

    if (!region || !value || !month || !year) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const regionName = regionMap[region.toLowerCase()];
    if (!regionName) {
      return res.status(400).json({ error: "Invalid region code" });
    }

    // Check Redis Cache First
    const cacheKey = `seasonal:${region}:${value}:${month}:${year}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Get province IDs based on region
    const provinceQuery = `SELECT id, name FROM province WHERE region = $1`;
    const provinceResult = await pool.query(provinceQuery, [regionName]);
    const provinceIds = provinceResult.rows.map(row => row.id);
    const provinceMap = Object.fromEntries(provinceResult.rows.map(row => [row.id, row.name]));

    if (provinceIds.length === 0) {
      return res.status(404).json({ error: "No provinces found for the region" });
    }

    // Generate 6-month rolling window
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ error: "Invalid month format" });
    }

    let selectedMonths = [];
    let selectedYears = [];
    let currentYear = parseInt(year, 10);

    for (let i = 0; i < 6; i++) {
      const newIndex = (monthIndex + i) % 12;
      const newYear = currentYear + (newIndex < monthIndex ? 1 : 0);
      selectedMonths.push(monthNames[newIndex]);
      selectedYears.push(newYear);
    }

    // Construct Query for Matching Dates
    let dateConditions = selectedMonths.map((m, i) => `(TRIM(month) = '${m}' AND year = ${selectedYears[i]})`).join(" OR ");

    const dateQuery = `
      SELECT id, TRIM(month) AS month, year, province_id
      FROM sf_date
      WHERE (${dateConditions})
      AND province_id = ANY($1)
      ORDER BY year ASC, month ASC
    `;
    const dateResult = await pool.query(dateQuery, [provinceIds]);

    if (dateResult.rows.length === 0) {
      return res.status(404).json({ error: "No seasonal data found for the given months." });
    }

    const dateIds = dateResult.rows.map(row => row.id);
    const dateMap = Object.fromEntries(dateResult.rows.map(row => [row.id, {
      month: row.month,
      year: row.year,
      province: provinceMap[row.province_id]
    }]));

    let dataQuery, dataValues;

    if (value === "mm") {
      dataQuery = `
SELECT f.mean AS mean_mm, f.max AS max_mm, f.min AS min_mm, d.id AS date_id, prov.name AS province
FROM forecast_rf f
JOIN sf_date d ON f.date_id = d.id
JOIN province prov ON d.province_id = prov.id  -- Ensure province is properly joined
WHERE d.id = ANY($1)
ORDER BY d.year ASC, 
         ARRAY_POSITION(ARRAY['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], d.month) ASC,
         prov.name ASC;

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
ORDER BY d.year ASC, 
         ARRAY_POSITION(ARRAY['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], d.month) ASC,
         prov.name ASC;

      `;
      dataValues = [dateIds];
    } else if (value === "all") {
      dataQuery = `
SELECT d.id AS date_id, d.year, d.month, 
       p.mean AS percent_normal, f.mean AS mean_mm, 
       f.max AS max_mm, f.min AS min_mm, 
       p.description, prov.name AS province
FROM sf_date d
LEFT JOIN forecast_rf f ON d.id = f.date_id
LEFT JOIN percent_n p ON d.id = p.date_id
LEFT JOIN province prov ON d.province_id = prov.id  -- Ensure we join province table
WHERE d.id = ANY($1)
ORDER BY d.year ASC, 
         ARRAY_POSITION(ARRAY['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], d.month) ASC,
         prov.name ASC;

      `;
      dataValues = [dateIds];
    } else {
      return res.status(400).json({ error: "Invalid value parameter" });
    }

    const dataResult = await pool.query(dataQuery, dataValues);

    let formattedData = dataResult.rows.map(row => {
      let result = {
        province: dateMap[row.date_id].province,
        month: dateMap[row.date_id].month,
        year: dateMap[row.date_id].year
      };

      if (row.mean_mm !== null) result.mean_mm = row.mean_mm;
      if (row.max_mm !== null) result.max_mm = row.max_mm;
      if (row.min_mm !== null) result.min_mm = row.min_mm;
      if (row.percent_normal !== null) result.percent_normal = row.percent_normal;
      if (row.description !== null) result.description = row.description;

      return result;
    }).filter(entry => Object.keys(entry).length > 3); // Ensure only non-empty entries

    // Store Result in Redis Cache (1 Hour)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(formattedData));

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
