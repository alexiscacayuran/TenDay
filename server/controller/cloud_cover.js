import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query; // Accept the search query
  try {
    // Prepare the search value with wildcard for partial matching
    const searchValue = `%${search}%`;

    // Query to fetch data with a search filter on both municity and description
    const query = `
      SELECT 
        cloud_cover.cloud_id AS id, municities.municity || ', ' || municities.province AS city_and_province,
        TO_CHAR(date.date, 'Month DD, YYYY') AS formatted_date, 
        cloud_cover.description
      FROM cloud_cover
      INNER JOIN date ON cloud_cover.date_id = date.id
      INNER JOIN municities ON date.municity_id = municities.id
      WHERE 
        (municities.municity || ' ' || municities.province) ILIKE $1 
        OR cloud_cover.description ILIKE $1
      ORDER BY date.date DESC
      LIMIT $2 OFFSET $3;
    `;
    const values = [searchValue, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)];

    const result = await pool.query(query, values);

    // Query to count total number of records with the same search condition
    const countQuery = `
      SELECT COUNT(*) 
      FROM cloud_cover
      INNER JOIN date ON cloud_cover.date_id = date.id
      INNER JOIN municities ON date.municity_id = municities.id
      WHERE 
        (municities.municity || ' ' || municities.province) ILIKE $1
        OR cloud_cover.description ILIKE $1;
    `;
    const countResult = await pool.query(countQuery, [searchValue]);

    // Send response with data and total count for pagination
    res.json({
      data: result.rows,
      totalCount: countResult.rows[0].count, // Send filtered total count
    });
  } catch (error) {
    console.error("Error fetching cloud_cover data:", error);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
