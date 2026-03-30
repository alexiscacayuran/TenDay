import { pool } from "../db.js"; // Import DB connection

export const logApiRequest = async (req, api_id) => {
  const { originalUrl: endpoint, method, body, query, headers } = req;

  // Accept token from either query or header
  const token = query.token || headers["token"] || headers["authorization"];

  try {
    const tokenResult = await pool.query(
      `SELECT id, organization, api_ids FROM api_tokens WHERE token = $1 LIMIT 1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      console.log("❌ Invalid token. Skipping log.");
      return null;
    }

    const { id: token_id, organization } = tokenResult.rows[0];

    const logResult = await pool.query(
      `INSERT INTO api_logs (organization, endpoint, method, request_time, request_body, request_query, api_id, token_id)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7) RETURNING id`,
      [
        organization,
        endpoint,
        method,
        JSON.stringify(body),
        JSON.stringify(query),
        api_id,
        token_id,
      ]
    );

    return logResult.rows[0].id;
  } catch (error) {
    console.error("🚨 Error logging API request:", error);
    return null;
  }
};

