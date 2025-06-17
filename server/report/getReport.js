import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.post('/getreport', async (req, res) => {
  const { category, location, comment, email } = req.body;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    // Check for duplicate with same email, comment, and location
    const duplicateCheck = await pool.query(
      `SELECT * FROM feedback WHERE email = $1 AND comment = $2 AND location = $3`,
      [email, comment, location]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Duplicate: Same feedback already submitted' });
    }

    // Insert feedback if not duplicate
    const insertQuery = `
      INSERT INTO feedback (category, location, comment, email, status)
      VALUES ($1, $2, $3, $4, 1)
      RETURNING *;
    `;
    const values = [category, location || null, comment || null, email || null];
    const result = await pool.query(insertQuery, values);

    // Format timestamp to Manila time
    const feedbackWithManilaTime = {
      ...result.rows[0],
      timestamp: new Date(result.rows[0].timestamp).toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };

    res.status(201).json({ message: 'Feedback submitted', feedback: feedbackWithManilaTime });
  } catch (err) {
    console.error('Error inserting feedback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
