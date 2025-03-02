import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query; // Accept the search query
    try {
      // Modified query to include a search filter
      const query = `
        SELECT wind.wind_id AS id, CONCAT(municities.municity, ', ', municities.province) AS municities,
               TO_CHAR(date.date, 'Month DD, YYYY') AS formatted_date,
               wind.speed, wind.direction
        FROM wind
        INNER JOIN date ON wind.date_id = date.id
        INNER JOIN municities ON date.municity_id = municities.id
        WHERE CONCAT(municities.municity, ' ', municities.province) ILIKE $1 OR wind.direction ILIKE $1
        ORDER BY date.date DESC
        LIMIT $2 OFFSET $3;
      `;
      
      // Use the search term in a case-insensitive way (ILIKE)
      const searchValue = `%${search}%`; // Add wildcard to search for partial matches
      const values = [searchValue, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)];

      const result = await pool.query(query, values);
  
      // Get the total count for pagination with search filter applied
      const countQuery = `
        SELECT COUNT(*) 
        FROM wind
        INNER JOIN date ON wind.date_id = date.id
        INNER JOIN municities ON date.municity_id = municities.id
        WHERE CONCAT(municities.municity, ' ', municities.province) ILIKE $1 OR wind.direction ILIKE $1;
      `;
      const countResult = await pool.query(countQuery, [searchValue]);

      res.json({
        data: result.rows,
        totalCount: countResult.rows[0].count, // Send filtered total count
      });
    } catch (error) {
      console.error("Error fetching wind data:", error);
      res.status(500).json({ error: "Database error" });
    }
});

export default router;
