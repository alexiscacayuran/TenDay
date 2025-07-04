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

    const tokenResult = await pool.query(
      `SELECT api_ids FROM api_tokens WHERE token = $1 LIMIT 1`,
      [token]
    );

    if (
      tokenResult.rows.length === 0 ||
      !tokenResult.rows[0].api_ids.includes(6)
    ) {
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

    // ✅ Return all region names and codes in order
    if (!region && !province) {
      const regionGroups = {};

      for (const [code, name] of Object.entries(regionMap)) {
        if (!regionGroups[name]) {
          regionGroups[name] = new Set();
        }
        regionGroups[name].add(code.toLowerCase());
      }

      const customOrder = [
        "Ilocos Region (Region I)",
        "Cagayan Valley (Region II)",
        "Central Luzon (Region III)",
        "CALABARZON (Region IV-A)",
        "MIMAROPA (Region IV-B)",
        "Bicol Region (Region V)",
        "Western Visayas (Region VI)",
        "Central Visayas (Region VII)",
        "Eastern Visayas (Region VIII)",
        "Zamboanga Peninsula (Region IX)",
        "Northern Mindanao (Region X)",
        "Davao Region (Region XI)",
        "SOCCSKSARGEN (Region XII)",
        "Caraga (Region XIII)",
        "National Capital Region (NCR)",
        "Cordillera Administrative Region (CAR)",
        "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
        "Negros Island Region (Region XVIII)"
      ];

      const formatted = customOrder
        .filter(name => regionGroups[name])
        .map(name => ({
          name,
          codes: Array.from(regionGroups[name]).sort().join(", ")
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

    let result, cacheKey;

    // 🎯 REGION MODE
    if (region) {
      const normalized = regionMap[region.toLowerCase()];
      if (!normalized) {
        return res.status(400).json({
          metadata: {
            request_no: requestNo,
            api: "Location",
            forecast: "Municipalities, Provinces, and Regions",
          },
          data: [],
          footer: {
            ...baseFooter,
            status_code: 400,
            description: "Bad Request: Invalid region code",
          },
        });
      }

      cacheKey = `region:${normalized}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const provinces = JSON.parse(cached);
        return res.json({
          metadata: {
            request_no: requestNo,
            api: "Location",
            forecast: "Municipalities, Provinces, and Regions",
            region: normalized,
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

      result = await pool.query(
        `SELECT DISTINCT province FROM municities WHERE region = $1 ORDER BY province ASC`,
        [normalized]
      );

      const provinces = result.rows.map(r => r.province);
      await redisClient.set(cacheKey, JSON.stringify(provinces), "EX", 3600);

      return res.json({
        metadata: {
          request_no: requestNo,
          api: "Location",
          forecast: "Municipalities, Provinces, and Regions",
          region: normalized,
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

    // 🎯 PROVINCE MODE
    if (province) {
      cacheKey = `province:${province}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const municipalities = JSON.parse(cached);

        const regResult = await pool.query(
          `SELECT DISTINCT region FROM municities WHERE province = $1`,
          [province]
        );
        const regionName = regResult.rows[0]?.region || null;

        return res.json({
          metadata: {
            request_no: requestNo,
            api: "Location",
            forecast: "Municipalities, Provinces, and Regions",
            province,
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

      result = await pool.query(
        `SELECT municity FROM municities WHERE province = $1 ORDER BY municity ASC`,
        [province]
      );

      const municipalities = result.rows.map(r => r.municity);
      await redisClient.set(cacheKey, JSON.stringify(municipalities), "EX", 3600);

      const regResult = await pool.query(
        `SELECT DISTINCT region FROM municities WHERE province = $1`,
        [province]
      );
      const regionName = regResult.rows[0]?.region || null;

      return res.json({
        metadata: {
          request_no: requestNo,
          api: "Location",
          forecast: "Municipalities, Provinces, and Regions",
          province,
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
