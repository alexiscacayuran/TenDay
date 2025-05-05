// routes/municities.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Get all municities with optional search and pagination
router.get("/", async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  let query = "SELECT * FROM municities";
  let countQuery = "SELECT COUNT(*) FROM municities";
  const values = [];
  
  if (search) {
    query += " WHERE municity ILIKE $1 OR province ILIKE $1 OR region ILIKE $1";
    countQuery += " WHERE municity ILIKE $1 OR province ILIKE $1 OR region ILIKE $1";
    values.push(`%${search}%`);
  }

  // Adjust placeholders for limit and offset based on whether search is present
  const limitPlaceholder = search ? `$2` : `$1`;
  const offsetPlaceholder = search ? `$3` : `$2`;
  
  query += ` ORDER BY province ASC, municity ASC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;
  values.push(parseInt(limit, 10), (parseInt(page, 10) - 1) * parseInt(limit, 10));

  try {
    const result = await pool.query(query, values);
    const countResult = await pool.query(countQuery, values.slice(0, search ? 1 : 0)); // Use same values without pagination
    res.json({
      data: result.rows,
      totalCount: parseInt(countResult.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: "Database error" });
  }
});

// Add a new municity
router.post("/", async (req, res) => {
  const { municity, province, region } = req.body;
  const query = "INSERT INTO municities (municity, province, region) VALUES ($1, $2, $3) RETURNING *";
  try {
    const result = await pool.query(query, [municity, province, region]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// Update a municity
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { municity, province, region } = req.body;
  const query = "UPDATE municities SET municity = $1, province = $2, region = $3 WHERE id = $4 RETURNING *";
  try {
    const result = await pool.query(query, [municity, province, region, id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// Delete a municity
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Delete the municity
    const deleteQuery = "DELETE FROM municities WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    // Reset the sequence for the `id` column
    const resetSequenceQuery = "ALTER TABLE municities ALTER COLUMN id SET DEFAULT nextval('municities_id_seq'::regclass)";
    await pool.query(resetSequenceQuery);

    // Set the sequence to the highest `id` value after deletion
    const resetSeqValQuery = "SELECT setval('municities_id_seq', (SELECT MAX(id) FROM municities))";
    await pool.query(resetSeqValQuery);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting municity:', error);
    res.status(500).json({ error: "Database error" });
  }
});


// Get all unique provinces with their regions
router.get("/provinces", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT province, region FROM municities ORDER BY province");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching provinces:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Get all unique regions
router.get("/regions", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT region FROM municities ORDER BY region");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
