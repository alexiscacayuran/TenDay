// routes/files.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Get all files with optional search and pagination
router.get("/", async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  const values = [];
  
  // Base query
  let query = `
    SELECT id, file_name, file_hash, TO_CHAR(logdate, 'FMMonth DD, YYYY, HH12:MI AM') AS logdate
    FROM activity_log
  `;
  let countQuery = "SELECT COUNT(*) FROM activity_log";
  
  // Search functionality
  if (search) {
    query += " WHERE file_name ILIKE $1";
    countQuery += " WHERE file_name ILIKE $1";
    values.push(`%${search}%`);
  }

  // Pagination
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  query += ` ORDER BY file_name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(parseInt(limit, 10), offset);

  try {
    const result = await pool.query(query, values);
    const countResult = await pool.query(countQuery, values.slice(0, search ? 1 : 0)); // Use the same values for count query
    res.json({
      data: result.rows,
      totalCount: parseInt(countResult.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: "Database error" });
  }
});

// Add a new file
router.post("/", async (req, res) => {
  const { file_name, logdate, file_hash } = req.body;
  const query = "INSERT INTO activity_log (file_name, logdate, file_hash) VALUES ($1, $2, $3) RETURNING *";
  try {
    const result = await pool.query(query, [file_name, logdate, file_hash]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// Update a file
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { file_name, logdate, file_hash } = req.body;
  const query = "UPDATE activity_log SET file_name = $1, logdate = $2, file_hash = $3 WHERE id = $4 RETURNING *";
  try {
    const result = await pool.query(query, [file_name, logdate, file_hash, id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// Delete a file
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Delete the file
    const deleteQuery = "DELETE FROM activity_log WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    // Reset the sequence for the `id` column
    const resetSequenceQuery = "ALTER TABLE activity_log ALTER COLUMN id SET DEFAULT nextval('activity_log_id_seq'::regclass)";
    await pool.query(resetSequenceQuery);

    // Set the sequence to the highest `id` value after deletion
    const resetSeqValQuery = "SELECT setval('activity_log_id_seq', (SELECT MAX(id) FROM activity_log))";
    await pool.query(resetSeqValQuery);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
