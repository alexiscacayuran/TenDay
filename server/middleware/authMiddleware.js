import { pool } from '../db.js';
import { redisClient } from '../db.js'; 

export const authenticateToken = (api_id) => {
  return async (req, res, next) => {
    const token = req.headers["token"];
    let api_name = "Unknown API"; 
    let forecast_label = "Forecast";

    const baseMetadata = {
      api: api_name,
      forecast: forecast_label
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
      const apiResult = await pool.query(`SELECT name, forecast FROM api WHERE id = $1`, [api_id]);
      if (apiResult.rows.length > 0) {
        api_name = apiResult.rows[0].name;
        forecast_label = apiResult.rows[0].forecast;
        baseMetadata.api = api_name;
        baseMetadata.forecast = forecast_label;
      }
    } catch (err) {
      console.error("⚠️ Error fetching API name:", err.message);
    }

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
        api_name,
        forecast: forecast_label
      };

      // Bypass rate limiting for internal orgs
      if (organization === "10-Day Forecast") {
        return next();
      }

      // Rate limit settings (per token)
      const rateLimitKey = `rate_limit:${token}:${api_id}`;
      const cooldownKey = `last_request_time:${token}:${api_id}`;
      const MAX_REQUESTS = 1000;
      const COOL_DOWN_TIME = 60; // seconds

      const currentCount = parseInt(await redisClient.get(rateLimitKey)) || 0;

      if (currentCount >= MAX_REQUESTS) {
        const lastRequestTime = await redisClient.get(cooldownKey);
        if (lastRequestTime) {
          const timeElapsed = Date.now() - parseInt(lastRequestTime);
          if (timeElapsed < COOL_DOWN_TIME * 1000) {
            return res.status(429).json({
              metadata: baseMetadata,
              forecast: [],
              misc: {
                ...baseMisc,
                status_code: 429,
                description: `Too many requests. Please wait ${COOL_DOWN_TIME} seconds.`
              }
            });
          }
        }
      }

      // Increment and set cooldown
      await redisClient.multi()
        .incr(rateLimitKey)
        .expire(rateLimitKey, 3600) // 1 hour bucket
        .set(cooldownKey, Date.now())
        .expire(cooldownKey, COOL_DOWN_TIME)
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
