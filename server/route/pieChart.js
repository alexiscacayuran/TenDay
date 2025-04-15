import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/apiPie", async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const offset = (page - 1) * limit;

    // Query to count total rows
    const countQuery = `
      SELECT COUNT(DISTINCT organization) AS total FROM api_logs WHERE organization <> '10-Day Forecast'
    `;
    const countResult = await pool.query(countQuery);
    const totalItems = countResult.rows[0].total; 

    // Query to fetch data
    let query = `
      SELECT 
        organization,
        COUNT(*) FILTER (WHERE DATE(request_time) = CURRENT_DATE) AS daily_count,
        COUNT(*) FILTER (WHERE DATE_TRUNC('week', request_time) = DATE_TRUNC('week', CURRENT_DATE)) AS weekly_count,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', request_time) = DATE_TRUNC('month', CURRENT_DATE)) AS monthly_count,
        COUNT(*) AS all_time_count
      FROM api_logs
      WHERE organization <> '10-Day Forecast'
      GROUP BY organization
      ORDER BY organization ASC
    `;

    // Apply pagination only if page and limit exist
    if (!isNaN(page) && !isNaN(limit)) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const result = await pool.query(query);
    
    res.json({
      totalItems, // Send total items count for pagination in frontend
      data: result.rows, // Paginated data or full data if no pagination
    });

  } catch (error) {
    console.error("Error fetching organization counts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

