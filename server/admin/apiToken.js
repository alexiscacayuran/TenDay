import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/apiTokens?page=1&limit=10
router.get('/apiTokens', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const tokens = await pool.query(
      `SELECT id, name, forecast, description, endpoint 
       FROM api 
       ORDER BY name 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalCount = await pool.query('SELECT COUNT(*) FROM api');
    const totalPages = Math.ceil(totalCount.rows[0].count / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalCount: parseInt(totalCount.rows[0].count),
      data: tokens.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/apiTokens/:id
router.put('/api/apiTokens/:id', async (req, res) => {
  const { id } = req.params;
  const { name, forecast, description, endpoint } = req.body;

  try {
    const result = await pool.query(
      `UPDATE api SET name = $1, forecast = $2, description = $3, endpoint = $4 WHERE id = $5`,
      [name, forecast, description, endpoint, id]
    );

    if (result.rowCount > 0) {
      res.sendStatus(200);
    } else {
      res.status(404).send('Token not found');
    }
  } catch (err) {
    console.error('Failed to update token', err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /api/apiTokens/:id
router.delete('/api/apiTokens/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM api WHERE id = $1`,
      [id]
    );

    if (result.rowCount > 0) {
      res.sendStatus(200);
    } else {
      res.status(404).send('Token not found');
    }
  } catch (err) {
    console.error('Failed to delete token', err.message);
    res.status(500).send('Server error');
  }
});

export default router;
