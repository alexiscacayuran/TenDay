import express from "express";
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
  "ncr": "National Capital Region (NCR)", "NCR": "National Capital Region (NCR)",
  "barmm": "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
  "nir": "Negros Island Region (Region XVIII)"
};

router.get("/location", authenticateToken(6), async (req, res) => {
  try {
    const token = req.headers["token"];
    const { region, province } = req.query;

    const baseFooter = {
      version: "1.0",
      timestamp: new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }).replace(",", ""),
      method: "GET",
      current_page: 1,
      per_page: 0,
      total_count: 0,
      total_pages: 1,
    };

    const tokenResult = await pool.query(`SELECT api_ids FROM api_tokens WHERE token = $1 LIMIT 1`, [token]);
    if (tokenResult.rows.length === 0 || !tokenResult.rows[0].api_ids.includes(6)) {
      return res.status(403).json({
        metadata: {
          api: "Location",
          forecast: "Municipalities, Provinces, and Regions",
        },
        data: [],
        footer: {
          ...baseFooter,
          status_code: 403,
          description: "Forbidden: You are not authorized to access this API.",
        },
      });
    }

    const requestNo = await logApiRequest(req, 6);

    const regionOrPsgc = region?.toLowerCase();
    const normalizedRegion = regionMap[regionOrPsgc];

    const regionResult = await pool.query(`SELECT DISTINCT region, r_psgc FROM municities`);
    const regionPsgcMap = {};
    regionResult.rows.forEach(r => {
      if (!regionPsgcMap[r.region]) regionPsgcMap[r.region] = r.r_psgc;
    });

    if (!region && !province) {
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
        "Cordillera Administrative Region (CAR)", "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
        "Negros Island Region (Region XVIII)"
      ];

      const formatted = customOrder.filter(name => regionGroups[name]).map(name => ({
        name,
        codes: Array.from(regionGroups[name]).sort().join(", "),
        psgc_code: regionPsgcMap[name] || null
      }));

      return res.json({
        metadata: {
          request_no: requestNo,
          api: "Location",
          forecast: "Municipalities, Provinces, and Regions",
        },
        data: formatted,
        footer: {
          ...baseFooter,
          total_count: formatted.length,
          per_page: formatted.length,
          status_code: 200,
          description: "OK",
        },
      });
    }

    // REGION MODE
    if (region) {
      const result = await pool.query(`
        SELECT DISTINCT province, p_psgc, region
        FROM municities
        WHERE LOWER(region) = $1 OR r_psgc = $2
        ORDER BY province ASC
      `, [normalizedRegion?.toLowerCase(), region]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          metadata: {
            request_no: requestNo,
            api: "Location",
            forecast: "Municipalities, Provinces, and Regions",
          },
          data: [],
          footer: {
            ...baseFooter,
            status_code: 404,
            description: "Bad Request: Provided province or region not found",
          },
        });
      }

      const provinces = result.rows.map(r => ({ name: r.province, psgc_code: r.p_psgc }));
      const fullRegionName = result.rows[0]?.region || normalizedRegion || region;

      return res.json({
        metadata: {
          request_no: requestNo,
          api: "Location",
          forecast: "Municipalities, Provinces, and Regions",
          region: fullRegionName,
        },
        data: provinces,
        footer: {
          ...baseFooter,
          total_count: provinces.length,
          per_page: provinces.length,
          status_code: 200,
          description: "OK",
        },
      });
    }

    // PROVINCE MODE
    if (province) {
      const result = await pool.query(`
        SELECT municity, m_psgc, province
        FROM municities
        WHERE LOWER(province) = $1 OR p_psgc = $2
        ORDER BY municity ASC
      `, [province?.toLowerCase(), province]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          metadata: {
            request_no: requestNo,
            api: "Location",
            forecast: "Municipalities, Provinces, and Regions",
          },
          data: [],
          footer: {
            ...baseFooter,
            status_code: 404,
            description: "Bad Request: Provided province or region not found",
          },
        });
      }

      const municipalities = result.rows.map(r => ({ name: r.municity, psgc_code: r.m_psgc }));

      const regResult = await pool.query(
        `SELECT DISTINCT region FROM municities WHERE LOWER(province) = $1 OR p_psgc = $2`,
        [province?.toLowerCase(), province]
      );
      const regionName = regResult.rows[0]?.region || null;
      const fullProvinceName = result.rows[0]?.province || province;

      return res.json({
        metadata: {
          request_no: requestNo,
          api: "Location",
          forecast: "Municipalities, Provinces, and Regions",
          province: fullProvinceName,
          region: regionName,
        },
        data: municipalities,
        footer: {
          ...baseFooter,
          total_count: municipalities.length,
          per_page: municipalities.length,
          status_code: 200,
          description: "OK",
        },
      });
    }
  } catch (error) {
    console.error("Error:", error.stack);
    return res.status(500).json({
      metadata: {
        api: "Location",
        forecast: "Municipalities, Provinces, and Regions",
      },
      data: [],
      footer: {
        version: "1.0",
        timestamp: new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }).replace(",", ""),
        method: "GET",
        current_page: 1,
        per_page: 0,
        total_count: 0,
        total_pages: 1,
        status_code: 500,
        description: "Internal Server Error",
      },
    });
  }
});

export default router;
