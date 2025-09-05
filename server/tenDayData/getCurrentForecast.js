import express from "express";
import Fuse from 'fuse.js'; 
import { pool, redisClient } from "../db.js"; 
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js"; 

const router = express.Router(); 

// Map of shorthand/alternative region codes to official region names
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

// Define API endpoint: /tenday/current
router.get("/tenday/current", authenticateToken(1), async (req, res) => {
  // Extract query params, defaulting page=1, limit=10
  let { municity, province, region, page = "1", limit = "10" } = req.query;

  const per_page = parseInt(limit); // Results per page
  // Handle pagination logic (null if "none")
  const current_page = page === "none" ? null : (isNaN(parseInt(page)) || parseInt(page) < 1 ? 1 : parseInt(page));

  const today = new Date().toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }); // Current PH date
  const offset = current_page ? (current_page - 1) * per_page : 0; // Pagination offset
  const timestamp = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }).replace(',', ''); // Timestamp for metadata

  // Base metadata
  const baseMetadata = {
    api: "Current Forecast",
    forecast: "10-day Forecast",
  };

  // Default response info
  const defaultMisc = {
    version: "1.0",
    timestamp,
    method: req.method,
    status_code: 200,
    description: "OK"
  };

  try {
    // Check if user is authorized (must have API id 0 or 1)
    const { api_ids } = req.user || {};
    const isAuthorized = api_ids?.some((id) => id === 0 || id === 1);

    if (!isAuthorized) {
      // Return 403 if unauthorized
      return res.status(403).json({
        metadata: baseMetadata,
        data: [],
        misc: {
          ...defaultMisc,
          status_code: 403,
          description: "Forbidden: You are not authorized to access this API.",
        },
      });
    }

    // Log API request (generate request number)
    const request_no = await logApiRequest(req, 1);
    if (!request_no) {
      // Return 401 if logging/authentication failed
      return res.status(401).json({
        metadata: baseMetadata,
        data: [],
        misc: {
          ...defaultMisc,
          status_code: 401,
          description: "Unauthorized: Invalid or expired token",
        },
      });
    }

    // Get reference rows of municities for fuzzy matching
    const refRows = (await pool.query(`
      SELECT DISTINCT 
        municity, province, region, 
        m_old AS "muniOld", p_old AS "provOld"
      FROM municities
    `)).rows;    

    // Fuse.js fuzzy search options
    const fuseOptions = {
      location: 8,
      threshold: 0.6,
      distance: 30,
      isCaseSensitive: false,
      includeScore: true,
      ignoreDiacritics: true,
      keys: ["municity", "province", "muniOld", "provOld"]
    };    
    
    const fuse = new Fuse(refRows, fuseOptions); // Initialize fuzzy search

    // --- Location matching logic ---
    if (municity) {
      // If municity param is a PSGC code → direct DB lookup
      const mPsgcRes = await pool.query(
        "SELECT municity, province, region FROM municities WHERE m_psgc = $1 LIMIT 1",
        [municity]
      );
      if (mPsgcRes.rowCount > 0) {
        // If found → override with DB result
        region = mPsgcRes.rows[0].region;
        province = mPsgcRes.rows[0].province;
        municity = mPsgcRes.rows[0].municity;
      } else {
        // Otherwise → fuzzy search
        let fuseQuery = {
          $or: [
            { municity },
            { muniOld: municity }
          ]
        };

        if (province) {
          // Narrow down by province if provided
          fuseQuery = {
            $and: [
              fuseQuery,
              { $or: [{ province }, { provOld: province }] }
            ]
          };
        }

        const results = fuse.search(fuseQuery);

        if (results.length > 0) {
          municity = results[0].item.municity;
          province = results[0].item.province;
          region = results[0].item.region;
        }
      }
    } else if (province) {
      // If province param is a PSGC code
      const pPsgcRes = await pool.query(
        "SELECT province, region FROM municities WHERE p_psgc = $1 LIMIT 1",
        [province]
      );
      if (pPsgcRes.rowCount > 0) {
        province = pPsgcRes.rows[0].province;
        region = pPsgcRes.rows[0].region;
      } else {
        // Otherwise → fuzzy search province
        const match = fuse.search(province).find(r => r.item.province);
        if (match) {
          province = match.item.province;
          region = match.item.region;
        }
      }
    } else if (region) {
      // Normalize region string (lowercase, no spaces)
      const normalized = region.toLowerCase().replace(/\s/g, '');
      if (regionMap[normalized]) {
        // Use mapped region if available
        region = regionMap[normalized];
      } else {
        // Otherwise check DB by PSGC code
        const psgcLookup = await pool.query("SELECT region FROM municities WHERE r_psgc = $1 LIMIT 1", [region]);
        if (psgcLookup.rows.length > 0) {
          region = psgcLookup.rows[0].region;
        } else {
          // Last fallback → fuzzy search
          const match = fuse.search(region).find(r => r.item.region);
          if (match) region = match.item.region;
        }
      }
    }

    // --- SQL Query for forecast data ---
    let query = `
      WITH total AS (
        SELECT COUNT(*) AS total_count 
        FROM municities AS m
        INNER JOIN date AS d ON m.id = d.municity_id
        WHERE d.date = $1`;
    const values = [today];

    // Add filters based on query params
    if (municity) {
      values.push(`%${municity}%`);
      query += ` AND m.municity ILIKE $${values.length}`;
    }
    if (province) {
      values.push(`%${province}%`);
      query += ` AND m.province ILIKE $${values.length}`;
    }
    if (region) {
      values.push(`%${region}%`);
      query += ` AND m.region ILIKE $${values.length}`;
    }

    // Select joined forecast data
    query += `)
      SELECT 
        (SELECT total_count FROM total) AS total_count,
        m.id AS location_id, m.municity, m.province, m.region,
        d.id AS date_id, d.date, d.start_date, 
        r.description as rainfall, r.total as total_rainfall,
        c.description as cloud_cover, 
        t.mean, t.min, t.max, 
        h.mean as humidity, 
        w.speed, w.direction 
      FROM 
        municities AS m 
      INNER JOIN date AS d ON m.id = d.municity_id 
      INNER JOIN rainfall AS r ON d.id = r.date_id 
      INNER JOIN cloud_cover AS c ON d.id = c.date_id 
      INNER JOIN temperature AS t ON d.id = t.date_id 
      INNER JOIN humidity AS h ON d.id = h.date_id 
      INNER JOIN wind AS w ON d.id = w.date_id 
      WHERE d.date = $1`;

    // Add filters again for data query
    if (municity) query += ` AND m.municity ILIKE $${values.indexOf(`%${municity}%`) + 1}`;
    if (province) query += ` AND m.province ILIKE $${values.indexOf(`%${province}%`) + 1}`;
    if (region) query += ` AND m.region ILIKE $${values.indexOf(`%${region}%`) + 1}`;

    // Sort by province then municity
    query += ` ORDER BY m.province ASC, m.municity ASC`;

    // Add pagination (if not disabled)
    if (current_page !== null) {
      query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(per_page, offset);
    }

    // Execute query
    const result = await pool.query(query, values);

    // Handle no results
    if (result.rowCount === 0) {
      const isBadRequest = municity || province || region;
      const statusCode = isBadRequest ? 400 : 404;
    
      const misc = {
        ...defaultMisc,
        ...(current_page !== null && {
          current_page,
          per_page,
          total_count: 0,
          total_page: 1,
        }),
      };
      
      misc.status_code = statusCode;
      misc.description = isBadRequest
        ? "Bad Request: Provided municipality, province, or region not found"
        : "No content: No current forecast data found";
      
      return res.status(statusCode).json({
        metadata: { request_no, ...baseMetadata },
        data: [],
        misc,
      });
    }

    // Pagination metadata
    const total_count = result.rows[0]?.total_count || 0;
    const total_page = current_page !== null ? Math.ceil(total_count / per_page) : 1;
    const issuance_date = result.rows[0]?.start_date
      ? new Date(result.rows[0].start_date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })
      : today;

    const forecastData = [];

    // Loop through query results
    for (const entry of result.rows) {
      const key = `forecast:${entry.location_id}:${entry.date_id}`; // Redis cache key
      const cachedData = await redisClient.hGetAll(key); // Check Redis cache

      let forecastEntry;
      if (cachedData && Object.keys(cachedData).length > 0) {
        // If cached → use cached data
        forecastEntry = { ...cachedData };
      } else {
        // Otherwise → format new forecast entry
        forecastEntry = {
          date: new Date(entry.date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }),
          ...(municity ? {} : { municity: entry.municity }),
          ...(province || municity ? {} : { province: entry.province }),
          ...(region || province || municity ? {} : { region: entry.region }),
          rainfall_desc: entry.rainfall,
          rainfall_total: entry.total_rainfall,
          cloud_cover: entry.cloud_cover,
          tmean: entry.mean,
          tmin: entry.min,
          tmax: entry.max,
          humidity: entry.humidity,
          wind_speed: entry.speed,
          wind_direction: entry.direction,
        };
        // Save to Redis (expire in 1 day)
        await redisClient.hSet(key, forecastEntry);
        await redisClient.expire(key, 86400);
      }

      forecastData.push(forecastEntry);
    }

    // Misc info for response
    const misc = {
      version: defaultMisc.version,
      timestamp: defaultMisc.timestamp,
      method: defaultMisc.method,
      ...(current_page !== null && {
        current_page,
        per_page,
        total_count,
        total_page,
      }),
      status_code: 200,
      description: "OK",
    };    

    const firstRow = result.rows[0];

    // Metadata for response
    const metadata = {
      request_no,
      api: "Current Forecast",
      forecast: "10-day Forecast",
      issuance_date,
    };
    
    // Add location info if provided in query
    if (req.query.region && firstRow?.region) metadata.region = firstRow.region;
    if (req.query.province && firstRow?.province) metadata.province = firstRow.province;
    if (req.query.municity && firstRow?.municity) metadata.municity = firstRow.municity;

    // ✅ Successful response
    return res.status(200).json({
      metadata,
      data: (municity && province) ? forecastData[0] : forecastData, // Return single row if specific municity+province
      misc,
    });

  } catch (error) {
    // Handle unexpected errors
    console.error("❌ Error executing query:", error);
    return res.status(500).json({
      metadata: baseMetadata,
      data: [],
      misc: {
        ...defaultMisc,
        status_code: 500,
        description: "Internal Server Error",
      },
    });
  }
});

export default router; 
