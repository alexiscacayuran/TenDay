import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/api/logs', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM api_logs
       WHERE organization != $1
       ORDER BY request_time DESC`,
      ['10-Day Forecast']
    );

    return res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching api logs:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
