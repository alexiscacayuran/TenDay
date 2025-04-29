import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET 
router.get('/apiLogs', async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    try {
      let tokens;
      let totalCount = await pool.query('SELECT COUNT(*) FROM api_logs');
      const total = parseInt(totalCount.rows[0].count);
  
      if (page && limit) {
        const offset = (page - 1) * limit;
        tokens = await pool.query(
          `SELECT id, organization, request_time, api_id, token_id
           FROM api_logs
           WHERE token_id <> 1
           ORDER BY request_time DESC 
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
  
        res.json({
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          data: tokens.rows
        });
  
      } else {
        // No pagination – return all
        tokens = await pool.query(
          `SELECT id, organization, request_time, api_id, token_id
           FROM api_logs
           WHERE token_id <> 1
           ORDER BY request_time DESC`
        );
  
        res.json({
          currentPage: 1,
          totalPages: 1,
          totalCount: tokens.rows.length,
          data: tokens.rows
        });
      }
  
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

// GET all API id-name pairs
router.get('/apis', async (req, res) => {
    try {
      const result = await pool.query('SELECT id, name FROM api');
      res.json(result.rows);
    } catch (err) {
      console.error('Failed to fetch API names', err.message);
      res.status(500).send('Server error');
    }
  });
  

export default router;
