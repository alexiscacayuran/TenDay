import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// ✅ GET: retrieve current form_open value
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT form_open FROM form_status LIMIT 1');
    res.json(result.rows[0]); // returns { form_open: true/false }
  } catch (err) {
    console.error('Error fetching form status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ PATCH: update form_open value
router.patch('/', async (req, res) => {
  try {
    const { value } = req.body;
    await pool.query('UPDATE form_status SET form_open = $1', [value]);
    res.json({ message: 'Form status updated', form_open: value });
  } catch (err) {
    console.error('Error updating form status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
