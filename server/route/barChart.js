import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/apiBar", async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const offset = (page - 1) * limit;

    // Query to count total rows (excluding '10-Day Forecast')
    const countQuery = `
      SELECT COUNT(DISTINCT l.api_id) AS total
      FROM api_logs l
      WHERE l.organization <> '10-Day Forecast'
    `;
    const countResult = await pool.query(countQuery);
    const totalItems = countResult.rows[0].total;

    // Query to fetch data
    let query = `
      SELECT 
        l.api_id,
        a.name AS api_name,
        COUNT(*) FILTER (WHERE DATE(l.request_time) = CURRENT_DATE) AS daily_count,
        COUNT(*) FILTER (WHERE DATE_TRUNC('week', l.request_time) = DATE_TRUNC('week', CURRENT_DATE)) AS weekly_count,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', l.request_time) = DATE_TRUNC('month', CURRENT_DATE)) AS monthly_count,
        COUNT(*) AS all_time_count
      FROM api_logs l
      INNER JOIN api a ON a.id = l.api_id
      WHERE l.organization <> '10-Day Forecast'
      GROUP BY l.api_id, a.name
      ORDER BY a.name ASC
    `;

    // Apply pagination if page and limit are provided
    if (!isNaN(page) && !isNaN(limit)) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    // Execute the query to fetch the data
    const result = await pool.query(query);

    // Return the result
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
