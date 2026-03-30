import express from "express";
import { pool } from "../db.js";
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
  "ncr": "National Capital Region (NCR)", "NCR": "National Capital Region (NCR)",
  "barmm": "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
  "nir": "Negros Island Region (Region XVIII)",
  "car": "Cordillera Administrative Region (CAR)"
};

router.get("/location", authenticateToken(6), async (req, res) => {
  const { region, province, year, month, day } = req.query;

  const baseFooter = {
    version: "1.0",
    timestamp: new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }).replace(",", ""),
    method: "GET",
    current_page: 1,
    per_page: 0,
    total_count: 0,
    total_pages: 1,
  };

  try {
    const requestNo = await logApiRequest(req, 6);

    // -------------------------
    // NO PARAMS → RETURN REGIONS
    // -------------------------
    if (!region && !province && !year && !month && !day) {
      const regionResult = await pool.query(
        `SELECT region, MIN(r_psgc::bigint) AS psgc_code
         FROM municities
         GROUP BY region`
      );

      const regionGroups = {};
      for (const [code, name] of Object.entries(regionMap)) {
        if (!regionGroups[name]) regionGroups[name] = new Set();
        regionGroups[name].add(code.toLowerCase());
      }

      const customOrder = [
        "Ilocos Region (Region I)", "Cagayan Valley (Region II)", "Central Luzon (Region III)",
        "CALABARZON (Region IV-A)", "MIMAROPA (Region IV-B)", "Bicol Region (Region V)",
        "Western Visayas (Region VI)", "Central Visayas (Region VII)", "Eastern Visayas (Region VIII)",
        "Zamboanga Peninsula (Region IX)", "Northern Mindanao (Region X)", "Davao Region (Region XI)",
        "SOCCSKSARGEN (Region XII)", "Caraga (Region XIII)", "National Capital Region (NCR)",
        "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)", "Negros Island Region (Region XVIII)",
        "Cordillera Administrative Region (CAR)"
      ];

      const formatted = customOrder
        .filter(name => regionGroups[name])
        .map(name => {
          const r = regionResult.rows.find(r => r.region === name);
          return {
            name,
            codes: Array.from(regionGroups[name]).sort().join(", "),
            psgc_code: r?.psgc_code?.toString() || null
          };
        });

      return res.json({
        metadata: { request_no: requestNo, api: req.user.api_name, forecast: req.user.forecast },
        data: formatted,
        footer: { ...baseFooter, total_count: formatted.length, per_page: formatted.length, status_code: 200, description: "OK" }
      });
    }

    // -------------------------
    // REGION PARAM → RETURN PROVINCES
    // -------------------------
    if (region) {
      const normalizedRegion = regionMap[region.toLowerCase()] || region;

      const result = await pool.query(
        `SELECT province, MIN(p_psgc::bigint) AS psgc_code
         FROM municities
         WHERE LOWER(region) = $1 OR r_psgc = $2
         GROUP BY province
         ORDER BY province ASC`,
        [normalizedRegion.toLowerCase(), region]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          metadata: { request_no: requestNo, api: req.user.api_name, forecast: req.user.forecast },
          data: [],
          footer: { ...baseFooter, status_code: 404, description: "Region not found" }
        });
      }

      const provinces = result.rows.map(r => ({ name: r.province, psgc_code: r.psgc_code.toString() }));

      return res.json({
        metadata: { request_no: requestNo, api: req.user.api_name, forecast: req.user.forecast, region: normalizedRegion },
        data: provinces,
        footer: { ...baseFooter, total_count: provinces.length, per_page: provinces.length, status_code: 200, description: "OK" }
      });
    }

    // -------------------------
    // PROVINCE PARAM → RETURN MUNICIPALITIES
    // -------------------------
    if (province) {
      const result = await pool.query(
        `SELECT municity, MIN(m_psgc::bigint) AS psgc_code
         FROM municities
         WHERE LOWER(province) = $1 OR p_psgc = $2
         GROUP BY municity
         ORDER BY municity ASC`,
        [province.toLowerCase(), province]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          metadata: { request_no: requestNo, api: req.user.api_name, forecast: req.user.forecast },
          data: [],
          footer: { ...baseFooter, status_code: 404, description: "Province not found" }
        });
      }

      const municipalities = result.rows.map(r => ({ name: r.municity, psgc_code: r.psgc_code.toString() }));

      return res.json({
        metadata: { request_no: requestNo, api: req.user.api_name, forecast: req.user.forecast, province },
        data: municipalities,
        footer: { ...baseFooter, total_count: municipalities.length, per_page: municipalities.length, status_code: 200, description: "OK" }
      });
    }

    // -------------------------
    // YEAR/MONTH/DAY → RETURN TENDAY FILES
    // -------------------------
    if (year && month && day) {
      const result = await pool.query(
        `SELECT id, file_name, file_path, created_at
         FROM tenday_files
         WHERE year = $1 AND month = $2 AND day = $3
         ORDER BY created_at DESC`,
        [year, month, day]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          metadata: { request_no: requestNo, api: req.user.api_name, forecast: req.user.forecast },
          data: [],
          footer: { ...baseFooter, status_code: 404, description: "No files found for the given date" }
        });
      }

      return res.json({
        metadata: { request_no: requestNo, api: req.user.api_name, forecast: req.user.forecast },
        data: result.rows,
        footer: { ...baseFooter, total_count: result.rowCount, per_page: result.rowCount, status_code: 200, description: "OK" }
      });
    }

    // -------------------------
    // FALLBACK → BAD REQUEST
    // -------------------------
    return res.status(400).json({
      metadata: { request_no: requestNo, api: req.user.api_name, forecast: req.user.forecast },
      data: [],
      footer: { ...baseFooter, status_code: 400, description: "Bad Request" }
    });

  } catch (err) {
    console.error("Error in /location:", err.stack);
    return res.status(500).json({
      metadata: { api: req.user?.api_name || "Location", forecast: req.user?.forecast || "Municipalities, Provinces, and Regions" },
      data: [],
      footer: { ...baseFooter, status_code: 500, description: "Internal Server Error" }
    });
  }
});

export default router;