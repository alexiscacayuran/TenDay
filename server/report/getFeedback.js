import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/feedback', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM feedback WHERE status = 1 ORDER BY timestamp ASC');

    const formatted = result.rows.map((item) => ({
      ...item,
        timestamp: new Date(item.timestamp + 'Z').toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error retrieving feedback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
