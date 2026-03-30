import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();

// ✅ Generate API Token (POST)
router.post('/generate-token', async (req, res) => {
    const { organization, expiresIn } = req.body;
  
    if (!organization || !expiresIn) {
      return res.status(400).json({ error: 'Organization and expiresIn are required' });
    }
  
    try {
      let expTimestamp = null; // Default: No expiration (lifetime)
  
      // If expiresIn is a number (e.g., seconds, hours, days), calculate expiration time
      if (expiresIn !== "lifetime") {
        expTimestamp = Math.floor(Date.now() / 1000) + parseInt(expiresIn); 
      }
  
      // Generate JWT Token with or without expiration
      const payload = expTimestamp ? { organization, exp: expTimestamp } : { organization };
      const token = jwt.sign(payload, process.env.jwtSecret);
  
      // Store token with expiration in PostgreSQL
      await pool.query(
        `INSERT INTO api_tokens (token, organization, expires_at) 
         VALUES ($1, $2, to_timestamp($3))`,
        [token, organization, expTimestamp]
      );
  
      res.json({ token, expires_at: expTimestamp ? new Date(expTimestamp * 1000).toISOString() : "lifetime" });
    } catch (error) {
      console.error('Error generating token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

export default router;
