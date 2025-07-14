import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, organization, email, token, expires_at FROM presigned_links ORDER BY expires_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching presigned links:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
