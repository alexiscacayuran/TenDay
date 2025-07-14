import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// PATCH: update form_open value
router.patch('/', async (req, res) => {
  try {
    const { value } = req.body;

    await pool.query(
      'UPDATE form_status SET form_open = $1',
      [value]
    );

    res.json({ message: 'Form status updated', form_open: value });
  } catch (err) {
    console.error('Error updating form status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
