// routes/users.js
import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Fetch users count grouped by owner_type
router.get("/user-stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT owner_type, COUNT(*) as count
      FROM users
      GROUP BY owner_type
    `);
    
    // Log the result to check what is returned from the query
    console.log(result.rows);

    // Send the result as JSON
    res.json(result.rows);
  } catch (err) {
    console.error("Error in query execution:", err.message);
    res.status(500).send("Server Error");
  }
});

export default router;
