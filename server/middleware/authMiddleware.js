import { pool } from '../db.js';
import { redisClient } from '../db.js'; 

export const authenticateToken = (api_id) => {
  return async (req, res, next) => {
    const token = req.headers["token"];
    let api_name = "Unknown API"; 

    const baseMetadata = {
      api: api_name,
      forecast: "10-day Forecast"
    };

    const baseMisc = {
      version: "1.0",
      timestamp: new Date().toLocaleString('en-CA', { timeZone: 'Asia/Manila' }).replace(',', ''),
      method: req.method,
      current_page: 1,
      per_page: 0,
      total_count: 0,
      total_pages: 0
    };

    try {
      const apiResult = await pool.query(`SELECT name FROM api WHERE id = $1`, [api_id]);
      if (apiResult.rows.length > 0) {
        api_name = apiResult.rows[0].name;
        baseMetadata.api = api_name;
      }
    } catch (err) {
      console.error("⚠️ Error fetching API name:", err.message);
    }

    // If token is missing, return error response
    if (!token) {
      return res.status(498).json({
        metadata: baseMetadata,
        forecast: [],
        misc: {
          ...baseMisc,
          status_code: 498,
          description: "Missing token"
        }
      });
    }

    try {
      const result = await pool.query(
        `SELECT organization, expires_at, api_ids FROM api_tokens WHERE token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(498).json({
          metadata: baseMetadata,
          forecast: [],
          misc: {
            ...baseMisc,
            status_code: 498,
            description: "Invalid token"
          }
        });
      }

      const { organization, expires_at, api_ids } = result.rows[0];

      // Check if token has expired
      const tokenExpired = expires_at && new Date(expires_at) < new Date();
      if (tokenExpired) {
        return res.status(498).json({
          metadata: baseMetadata,
          forecast: [],
          misc: {
            ...baseMisc,
            status_code: 498,
            description: "Expired token"
          }
        });
      }

      req.user = {
        organization,
        api_ids: Array.isArray(api_ids) ? api_ids : [],
        api_id,
        api_name
      };

      // Skip rate limiting for organization '10-Day Forecast'
      if (organization === "10-Day Forecast") {
        return next();
      }

      // Rate limiting: Check the number of requests from the user/IP
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown_ip";
      const rateLimitKey = `rate_limit:${ip}:${api_id}`;

      // Maximum requests allowed per hour
      const MAX_REQUESTS = 1;
      // Cooldown time in seconds
      const COOL_DOWN_TIME = 60;

      // Get the current request count for the user/IP
      const currentRequestCount = await redisClient.get(rateLimitKey);

      // If the rate limit is exceeded, return an error
      if (currentRequestCount >= MAX_REQUESTS) {
        // Check if cooldown time has passed
        const lastRequestTime = await redisClient.get(`last_request_time:${ip}:${api_id}`);

        if (lastRequestTime) {
          const timeElapsed = Date.now() - parseInt(lastRequestTime);

          if (timeElapsed < COOL_DOWN_TIME * 1000) {
            return res.status(429).json({
              metadata: {
                ...baseMetadata,
                api: api_name 
              },
              forecast: [],
              misc: {
                ...baseMisc,
                status_code: 429,
                description: `Too many requests. Please wait for ${COOL_DOWN_TIME} seconds.`
              }
            });
          }
        }
      }

      // If the rate limit is not exceeded, proceed with the request:
      await redisClient.multi()
        .incr(rateLimitKey) 
        .expire(rateLimitKey, 3600)  // TTL of 1 hour
        .set(`last_request_time:${ip}:${api_id}`, Date.now())  // Store the last request time
        .expire(`last_request_time:${ip}:${api_id}`, COOL_DOWN_TIME)  // TTL of cooldown time (1 minute)
        .exec();

      next();

    } catch (error) {
      console.error("🚨 DB error during token validation:", error.message);
      return res.status(500).json({
        metadata: baseMetadata,
        forecast: [],
        misc: {
          ...baseMisc,
          status_code: 500,
          description: "Internal server error"
        }
      });
    }
  };
};
