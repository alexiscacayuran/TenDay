import express from "express";
import { pool, redisClient } from "../db.js";

const router = express.Router();

// Region mapping
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

    const regionCode = region.toLowerCase(); // Convert to lowercase
    const regionName = regionMap[regionCode];
    
    if (!regionName) {
      return res.status(400).json({ error: "Invalid region code" });
    }
    
    if (!regionName) {
      return res.status(400).json({ error: "Invalid region code" });
    }

    // Redis caching key
    const cacheKey = `seasonal:${region}:${value}:${month}:${year}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Fetch province names instead of IDs
    const provinceQuery = `SELECT id, name FROM province WHERE region = $1`;
    const provinceResult = await pool.query(provinceQuery, [regionName]);
    const provinces = provinceResult.rows;

    if (provinces.length === 0) {
      return res.status(404).json({ error: "No provinces found for the region" });
    }

    const provinceIds = provinces.map(row => row.id);
    const provinceMap = Object.fromEntries(provinces.map(row => [row.id, row.name]));

    // Convert month number ("02") to full month name ("Feb")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month, 10) - 1;

    if (monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ error: "Invalid month format" });
    }

    // Select next 6 months including the given month
    const selectedMonths = [];
    for (let i = 0; i < 6; i++) {
      selectedMonths.push(monthNames[(monthIndex + i) % 12]);
    }

    // Fetch date IDs
    const dateQuery = `SELECT id, month, year, province_id FROM sf_date WHERE month = ANY($1) AND year = $2 AND province_id = ANY($3)`;
    const dateResult = await pool.query(dateQuery, [selectedMonths, year, provinceIds]);
    const dateIds = dateResult.rows.map(row => row.id);
    const dateMap = Object.fromEntries(dateResult.rows.map(row => [row.id, { 
      month: row.month, 
      year: row.year, 
      province: provinceMap[row.province_id] 
    }]));

    if (dateIds.length === 0) {
      return res.status(404).json({ error: "No seasonal data found" });
    }

    let dataQuery;
    let dataValues;
    let dataResult;

    if (value === "mm") {
      dataQuery = `
        SELECT f.mean AS mean_mm, f.max AS max_mm, f.min AS min_mm, d.id as date_id
        FROM forecast_rf f
        JOIN sf_date d ON f.date_id = d.id
        WHERE d.id = ANY($1)
        ORDER BY d.province_id ASC

      `;
      dataValues = [dateIds];
      dataResult = await pool.query(dataQuery, dataValues);
    } else if (value === "pn") {
      dataQuery = `
        SELECT p.mean AS percent_normal, f.mean AS mean_mm, p.description, d.id as date_id
        FROM percent_n p
        JOIN forecast_rf f ON p.date_id = f.date_id
        JOIN sf_date d ON f.date_id = d.id
        WHERE d.id = ANY($1)
        ORDER BY d.province_id ASC

      `;
      dataValues = [dateIds];
      dataResult = await pool.query(dataQuery, dataValues);
    } else if (value === "all") {
      dataQuery = `
        SELECT p.mean AS percent_normal, f.mean AS mean_mm, f.max AS max_mm, f.min AS min_mm, p.description, d.id as date_id
        FROM percent_n p
        JOIN forecast_rf f ON p.date_id = f.date_id
        JOIN sf_date d ON f.date_id = d.id
        WHERE d.id = ANY($1)
        ORDER BY d.province_id ASC
      `;
      
      dataValues = [dateIds];
      dataResult = await pool.query(dataQuery, dataValues);
    } else {
      return res.status(400).json({ error: "Invalid value parameter" });
    }

    // Format response based on "value"
    let formattedData;
    if (value === "mm") {
      formattedData = dataResult.rows.map(row => ({
        province: dateMap[row.date_id].province,
        month: dateMap[row.date_id].month,
        year: dateMap[row.date_id].year,
        mean_mm: row.mean_mm || null,
        max_mm: row.max_mm || null,
        min_mm: row.min_mm || null
      }));
    } else if (value === "pn") {
      formattedData = dataResult.rows.map(row => ({
        province: dateMap[row.date_id].province,
        month: dateMap[row.date_id].month,
        year: dateMap[row.date_id].year,
        mean_mm: row.mean_mm || null,
        percent_normal: row.percent_normal || null,
        description: row.description || null
      }));
    } else {
      formattedData = dataResult.rows.map(row => ({
        province: dateMap[row.date_id].province,
        month: dateMap[row.date_id].month,
        year: dateMap[row.date_id].year,
        mean_mm: row.mean_mm || null,
        max_mm: row.max_mm || null,
        min_mm: row.min_mm || null,
        percent_normal: row.percent_normal || null,
        description: row.description || null
      }));
    }

    // Cache result in Redis for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(formattedData));

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
