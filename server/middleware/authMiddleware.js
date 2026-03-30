import { pool } from "../db.js";
import { redisClient } from "../db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SECRET_KEY = process.env.jwtSecret;

function makeTokenHash(rawToken) {
  return crypto.createHmac("sha256", SECRET_KEY).update(rawToken).digest("hex");
}

export const authenticateToken = (api_id) => {
  return async (req, res, next) => {
    const token = req.headers["token"];
    let api_name = "Unknown API";
    let forecast_label = "Forecast";

    const baseMetadata = { api: api_name, forecast: forecast_label };

    const baseMisc = {
      version: "1.0",
      timestamp: new Date().toLocaleString("en-CA", { timeZone: "Asia/Manila" }).replace(",", ""),
      method: req.method,
      current_page: 1,
      per_page: 0,
      total_count: 0,
      total_pages: 0,
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
        misc: { ...baseMisc, status_code: 498, description: "Missing Token: Token is required but was not provided." },
      });
    }

    try {
      let row = null;
      let matchedBy = null;

      // ✅ NEW TOKENS: token_hash exists -> lookup by token_hash + decrypt AES
      if (SECRET_KEY) {
        const token_hash = makeTokenHash(token);

        const r1 = await pool.query(
          `SELECT id, token, token_hash, organization, expires_at, api_ids, status, role
          FROM api_tokens
          WHERE token_hash = $1`,
          [token_hash]
        );

        if (r1.rows.length > 0) {
          const candidate = r1.rows[0];

          // 🔹 Decrypt AES token
          let decryptedToken;
          try {
            const [ivHex, content] = candidate.token.split(":");
            if (ivHex && content && ivHex.length === 32) {
              const iv = Buffer.from(ivHex, "hex");
              const key = crypto.createHash("sha256").update(SECRET_KEY).digest();
              const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
              decryptedToken = decipher.update(content, "hex", "utf8") + decipher.final("utf8");
            } else {
              decryptedToken = null; // old/invalid token format
            }
          } catch (err) {
            decryptedToken = null;
          }

          // ✅ Compare provided token to decrypted token
          if (decryptedToken === token) {
            row = candidate;
            matchedBy = "hash"; // for debug
          }
        }
      }

      // ✅ OLD TOKENS: token_hash is NULL/blank -> token stored raw -> direct compare
      if (!row) {
        const r2 = await pool.query(
          `SELECT id, token, token_hash, organization, expires_at, api_ids, status, role
           FROM api_tokens
           WHERE token = $1 AND (token_hash IS NULL OR token_hash = '')`,
          [token]
        );

        if (r2.rows.length > 0) {
          row = r2.rows[0];
          matchedBy = "legacy";
        }
      }

      if (!row) {
        return res.status(498).json({
          metadata: baseMetadata,
          forecast: [],
          misc: { ...baseMisc, status_code: 498, description: "Invalid Token: The provided token is invalid or expired." },
        });
      }

      const { id, organization, expires_at, api_ids, status } = row;

      // ✅ Enforce API permission
const allowed = Array.isArray(api_ids) ? api_ids.map(Number) : [];
if (api_id != null && !allowed.includes(Number(api_id))) {
  return res.status(403).json({
    metadata: baseMetadata,
    forecast: [],
    misc: {
      ...baseMisc,
      status_code: 403,
      description: `Forbidden: You are not authorized to access this API.`,
    },
  });
}


      if (status !== 1) {
        return res.status(403).json({
          metadata: baseMetadata,
          forecast: [],
          misc: {
            ...baseMisc,
            status_code: 403,
            description: "Forbidden: Token is not activated. Please activate your token via the email link.",
          },
        });
      }

      const tokenExpired = expires_at && new Date(expires_at) < new Date();
      if (tokenExpired) {
        return res.status(498).json({
          metadata: baseMetadata,
          forecast: [],
          misc: { ...baseMisc, status_code: 498, description: "Expired Token: Your token has expired. Please renew or re-authenticate." },
        });
      }

      req.user = {
        organization,
        api_ids: Array.isArray(api_ids) ? api_ids : [],
        api_id,
        api_name,
        forecast: forecast_label,
        matchedBy, // optional debug
      };

      // Allow internal org bypass
      if (row.role === 1) return next();

      function secondsUntilMidnight() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        return Math.floor((midnight - now) / 1000);
      }

      // ✅ IMPORTANT: don’t use raw token in Redis keys if using hashed system
      const redisKeyBase = matchedBy === "hash" && SECRET_KEY ? makeTokenHash(token) : token;

      const rateLimitKey = `rate_limit:${redisKeyBase}:${api_id}`;
      const burstKey = `burst_count:${redisKeyBase}:${api_id}`;
      const cooldownKey = `last_request_time:${redisKeyBase}:${api_id}`;

      const MAX_REQUESTS = 5000;
      const MAX_BURST = 500;
      const COOL_DOWN_TIME = 60 * 60;

      const currentCount = parseInt(await redisClient.get(rateLimitKey)) || 0;
      const burstCount = parseInt(await redisClient.get(burstKey)) || 0;

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
                description: `Too many requests. Please wait ${Math.ceil((COOL_DOWN_TIME * 1000 - timeElapsed) / 1000)} seconds.`,
              },
            });
          }
        }
        await redisClient.del(burstKey);
      }

      if (currentCount >= MAX_REQUESTS) {
        return res.status(429).json({
          metadata: baseMetadata,
          forecast: [],
          misc: { ...baseMisc, status_code: 429, description: `Daily limit of ${MAX_REQUESTS} requests exceeded. Try again tomorrow.` },
        });
      }

      await redisClient
        .multi()
        .incr(rateLimitKey)
        .expire(rateLimitKey, secondsUntilMidnight())
        .incr(burstKey)
        .expire(burstKey, COOL_DOWN_TIME + 5)
        .set(cooldownKey, Date.now())
        .expire(cooldownKey, COOL_DOWN_TIME)
        .exec();

      return next();
    } catch (error) {
      console.error("🚨 DB error during token validation:", error.message);
      return res.status(500).json({
        metadata: baseMetadata,
        forecast: [],
        misc: { ...baseMisc, status_code: 500, description: "Internal server error" },
      });
    }
  };
};
