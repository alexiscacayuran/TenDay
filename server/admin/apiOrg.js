import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET 
router.get('/apiOrg', async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    try {
      let tokens;
      let totalCount = await pool.query('SELECT COUNT(*) FROM api_tokens');
      const total = parseInt(totalCount.rows[0].count);
  
      if (page && limit) {
        const offset = (page - 1) * limit;
        tokens = await pool.query(
          `SELECT id, organization, expires_at, created_at, api_ids 
           FROM api_tokens
           WHERE id <> 1
           ORDER BY organization 
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
          `SELECT id, organization, expires_at, created_at, api_ids 
           FROM api_tokens
           WHERE id <> 1
           ORDER BY organization`
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
  

  router.put('/apiOrg/:id', async (req, res) => {
    const { id } = req.params;
    const { organization, expires_at, api_ids } = req.body;
  
    try {
      const result = await pool.query(
        `UPDATE api_tokens 
         SET organization = $1, expires_at = $2, api_ids = $3::int[] 
         WHERE id = $4 
         RETURNING *`,
        [organization, expires_at, api_ids, id]
      );
  
      if (result.rowCount > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).send('Token not found');
      }
    } catch (err) {
      console.error('Failed to update token', err.message);
      res.status(500).send('Server error');
    }
  });  
  

// DELETE 
router.delete('/apiOrg/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Check if token has logs
      const logCheck = await pool.query(
        `SELECT COUNT(*) FROM api_logs WHERE token_id = $1`,
        [id]
      );
  
      const logCount = parseInt(logCheck.rows[0].count);
  
      if (logCount > 0) {
        // Update the logs to remove the reference to the token (either nullify or set to a placeholder)
        await pool.query(
          `UPDATE api_logs SET token_id = NULL WHERE token_id = $1`,
          [id]
        );
        console.log(`Logs associated with token ID ${id} have been dissociated.`);
      }
  
      // Proceed with deletion of the token
      const result = await pool.query(
        `DELETE FROM api_tokens WHERE id = $1`,
        [id]
      );
  
      if (result.rowCount > 0) {
        console.log(`Token with ID ${id} successfully deleted.`);
        res.sendStatus(200);
      } else {
        res.status(404).send('Token not found');
      }
    } catch (err) {
      console.log(`Error while trying to delete token with ID ${id}: ${err.message}`);
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
