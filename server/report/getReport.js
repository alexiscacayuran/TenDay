// getreport.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.post('/getreport', async (req, res) => {
  const { category, location, comment, email } = req.body;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const query = `
      INSERT INTO feedback (category, location, comment, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [category, location || null, comment || null, email || null];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Feedback submitted', feedback: result.rows[0] });
  } catch (err) {
    console.error('Error inserting feedback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
