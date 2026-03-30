import jwt from 'jsonwebtoken';
import { redisClient } from '../db.js';
import { pool } from '../db.js';

// ✅ Authenticate API Token (without Bearer)
export const authenticateToken = async (req, res, next) => {
    const token = req.headers['token']; // Direct token retrieval

    if (!token) {
        console.log("🚨 No token provided!");
        return res.status(401).json({ error: 'Unauthorized: Token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.jwtSecret);

        // ✅ Fetch expiration from PostgreSQL
        const result = await pool.query(
            `SELECT expires_at FROM api_tokens WHERE token = $1`, 
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Forbidden: Token not found' });
        }

        const { expires_at } = result.rows[0];

        // ✅ Check expiration
        if (expires_at && new Date(expires_at) < new Date()) {
            return res.status(403).json({ error: 'Forbidden: Token expired' });
        }

        console.log("✅ Token Validated:", decoded);
        req.user = decoded; // ✅ Attach decoded token to request
        next();
    } catch (err) {
        console.error("🚨 JWT Verification Failed:", err.message);
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
};

// ✅ Rate Limiting: Max 100 requests per day per token
export const rateLimit = async (req, res, next) => {
    const token = req.headers['token'];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Token required' });
    }

    const key = `rate_limit:${token}`;
    let currentCount = await redisClient.get(key);

    if (currentCount && parseInt(currentCount) >= 10) {
        console.log(`⛔ Rate limit exceeded. Try again in 1 minute.`);
        return res.status(429).json({ error: 'Rate limit exceeded. Try again in 1 minute.' });
    }
    

    currentCount = await redisClient.incr(key); // Increment count
    await redisClient.expire(key, 60); // ✅ Resets every 1 minute

    console.log(`🫳 API Usage: ${currentCount}/10`);

    next();
};


// ✅ Log API Calls in PostgreSQL
export const logApiCall = async (req, res, next) => {
    const token = req.headers['token']; 
    const endpoint = req.originalUrl;
    const method = req.method;
    const requestBody = req.body ? JSON.stringify(req.body) : null;
    const requestQuery = req.query ? JSON.stringify(req.query) : null;

    // ✅ Use `req.user.organization` instead of decoding the token again
    const organization = req.user?.organization || 'Unknown';

    try {
        await pool.query(
            `INSERT INTO api_logs (token, organization, endpoint, method, request_body, request_query)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [token, organization, endpoint, method, requestBody, requestQuery]
        );
        console.log(`🕿  API Call Logged: ${organization}`);
    } catch (error) {
        console.error('🚨 Error logging API call:', error);
    }

    next();
};
