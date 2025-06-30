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
          description: "Missing Token: Token is required but was not provided."
        }
      });
    }

    try {
      const result = await pool.query(
        `SELECT organization, expires_at, api_ids, status FROM api_tokens WHERE token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(498).json({
          metadata: baseMetadata,
          forecast: [],
          misc: {
            ...baseMisc,
            status_code: 498,
            description: "Invalid Token: The provided token is invalid or expired."
          }
        });
      }

      const { organization, expires_at, api_ids, status } = result.rows[0];

      if (status !== 1) {
        return res.status(403).json({
          metadata: baseMetadata,
          forecast: [],
          misc: {
            ...baseMisc,
            status_code: 403,
            description: "Forbidden: Token is not activated. Please activate your token via the email link."
          }
        });
      }

      const tokenExpired = expires_at && new Date(expires_at) < new Date();
      if (tokenExpired) {
        return res.status(498).json({
          metadata: baseMetadata,
          forecast: [],
          misc: {
            ...baseMisc,
            status_code: 498,
            description: "Expired Token: Your token has expired. Please renew or re-authenticate."
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

      // Allow internal org bypass
      if (organization === "10-Day Forecast") {
        return next();
      }

      // 🔁 Redis-based rate limiting
      const rateLimitKey = `rate_limit:${token}:${api_id}`;
      const burstKey = `burst_count:${token}:${api_id}`;
      const cooldownKey = `last_request_time:${token}:${api_id}`;
      const MAX_REQUESTS = 100;
      const MAX_BURST = 50;
      const COOL_DOWN_TIME = 60; // seconds

      const currentCount = parseInt(await redisClient.get(rateLimitKey)) || 0;
      const burstCount = parseInt(await redisClient.get(burstKey)) || 0;

      // Burst check
      if (burstCount >= MAX_BURST) {
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

        // Reset burst after cooldown
        await redisClient.del(burstKey);
      }

      // Hourly limit
      if (currentCount >= MAX_REQUESTS) {
        return res.status(429).json({
          metadata: baseMetadata,
          forecast: [],
          misc: {
            ...baseMisc,
            status_code: 429,
            description: `Hourly limit of ${MAX_REQUESTS} requests exceeded. Try again later.`
          }
        });
      }

      // Increment counters
      await redisClient.multi()
        .incr(rateLimitKey)
        .expire(rateLimitKey, 3600)
        .incr(burstKey)
        .expire(burstKey, COOL_DOWN_TIME + 5)
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
