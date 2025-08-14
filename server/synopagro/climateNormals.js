import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

router.get("/normals", authenticateToken(1), async (req, res) => {
  const { stn_code, month, page, per_page } = req.query;

  const baseMetadata = {
    api: "Climate Normals",
    forecast: "Climate",
  };
  const timestamp = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  try {
    // ✅ Check token permissions
    const { api_ids } = req.user || {};
    const isAuthorized = api_ids?.some((id) => id === 12);
    if (!isAuthorized) {
      return res.status(403).json({
        metadata: baseMetadata,
        data: [],
        misc: {
          version: "1.0",
          timestamp,
          method: req.method,
          status_code: 403,
          description: "Forbidden: You are not authorized to access this API.",
        },
      });
    }

    // ✅ Log API request
    const request_no = await logApiRequest(req, 1);
    if (!request_no) {
      return res.status(401).json({
        metadata: baseMetadata,
        data: [],
        misc: {
          version: "1.0",
          timestamp,
          method: req.method,
          status_code: 401,
          description: "Unauthorized: Invalid or expired token",
        },
      });
    }

    // ✅ Base query
    let query = `
      SELECT 
        n.stn_code,
        s.station AS stn_name,
        n.month,
        n.r_amount,
        n.r_days,
        n.t_max,
        n.t_min,
        n.t_mean,
        n.t_dbulb,
        n.t_wbulb,
        n.dew_point,
        n.vapor_pressure,
        n.rh,
        n.mslp,
        n.w_dir,
        n.w_spd,
        n.cloud,
        n.tstm,
        n.ltng,
        n.start_date,
        n.end_date
      FROM normals n
      JOIN stations s ON n.stn_code = s.stn_code
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    // ✅ Filter by stn_code
    if (stn_code) {
      query += ` AND n.stn_code = $${paramIndex++}`;
      values.push(stn_code);
    }

    // ✅ Filter by month(s)
    if (month) {
      const monthList = month.split(",").map(m => m.trim());
      query += ` AND n.month = ANY($${paramIndex++})`;
      values.push(monthList);
    }

    query += ` ORDER BY n.stn_code, n.month`;

    // ✅ Pagination
    let paginationApplied = false;
    let limit = 10;
    let offset = 0;
    let currentPage = 1;
    let total_count = 0;

    if (page !== undefined) {
      paginationApplied = true;
      currentPage = parseInt(page) || 1;
      limit = parseInt(per_page) || 10;

      // Count total rows
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS total_count`;
      const countResult = await pool.query(countQuery, values);
      total_count = parseInt(countResult.rows[0].count);

      offset = (currentPage - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    // ✅ Run main query
    const result = await pool.query(query, values);

    // ✅ Get start & end dates from the data
    const start_date = result.rows.length ? result.rows[0].start_date : null;
    const end_date = result.rows.length ? result.rows[0].end_date : null;

    // ✅ Build metadata
    const metadata = {
      request_no,
      ...baseMetadata,
      start_date,
      end_date,
    };
    if (stn_code) {
      metadata.stn_code = stn_code;
      metadata.stn_name = result.rows[0]?.stn_name || null;
    }
    if (month) {
      metadata.month = month;
    }

    // ✅ Remove certain fields from data[] if params exist
    let filteredRows = result.rows.map(row => {
      const newRow = { ...row };
      if (stn_code) {
        delete newRow.stn_code;
        delete newRow.stn_name;
      }
      if (month) {
        delete newRow.month;
      }
      delete newRow.start_date;
      delete newRow.end_date;
      return newRow;
    });

    // ✅ Build misc
    let misc;
    if (paginationApplied) {
      misc = {
        version: "1.0",
        timestamp,
        method: req.method,
        current_page: currentPage,
        per_page: limit,
        total_count,
        total_pages: Math.ceil(total_count / limit),
        status_code: 200,
        description: "OK",
      };
    } else {
      misc = {
        version: "1.0",
        timestamp,
        method: req.method,
        status_code: 200,
        description: "OK",
      };
    }

    // ✅ Response
    return res.status(200).json({
      metadata,
      data: filteredRows,
      misc,
    });

  } catch (error) {
    console.error("❌ Error executing query:", error);
    return res.status(500).json({
      metadata: baseMetadata,
      data: [],
      misc: {
        version: "1.0",
        timestamp,
        method: req.method,
        status_code: 500,
        description: "Internal Server Error",
      },
    });
  }
});

export default router;
