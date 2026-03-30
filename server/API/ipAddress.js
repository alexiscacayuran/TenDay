import express from "express";
import crypto from "crypto";
import { pool } from "../db.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";

const router = express.Router();

const SECRET_KEY = process.env.jwtSecret;
const API_ID = 14; 

/*
|--------------------------------------------------------------------------
| Log Middleware Wrapper
|--------------------------------------------------------------------------
*/
const logMiddleware = async (req, res, next) => {
  try {
    await logApiRequest(req, API_ID);
  } catch (err) {
    console.error("⚠️ Log middleware error:", err.message);
  }
  next();
};

/*
|--------------------------------------------------------------------------
| POST: Save IP address with token_id
|--------------------------------------------------------------------------
*/
router.post("/add-ip", 
  logMiddleware,
  authenticateToken(API_ID),
  async (req, res) => {
  try {
    const { ip_address, token_id } = req.body;

    if (!ip_address || !token_id) {
      return res.status(400).json({
        error: "ip_address and token_id are required",
      });
    }

    // 🔐 Hash the IP BEFORE storing
    const hashedIp = crypto
      .createHmac("sha256", process.env.jwtSecret)
      .update(ip_address)
      .digest("hex");

    const query = `
      INSERT INTO ip (ip_address, token_id)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const result = await pool.query(query, [hashedIp, token_id]);

    return res.status(201).json({
      message: "IP saved securely",
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



export default router;
