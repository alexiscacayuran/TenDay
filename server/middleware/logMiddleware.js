import { pool } from "../db.js"; // Import DB connection

export const logApiRequest = async (req, api_id) => {
  const { originalUrl: endpoint, method, body, query, headers } = req;
  const token = headers["token"]; // Extract token

  try {
    // Fetch API ID and token ID from database
    const tokenResult = await pool.query(
      `SELECT id, organization, api_ids FROM api_tokens WHERE token = $1 LIMIT 1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      console.log("❌ Invalid token. Skipping log.");
      return null; 
    }

    const { id: token_id, organization } = tokenResult.rows[0];

    // Insert log entry into `api_logs`
    const logResult = await pool.query(
      `INSERT INTO api_logs (organization, endpoint, method, request_time, request_body, request_query, api_id, token_id)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7) RETURNING id`,
      [organization, endpoint, method, JSON.stringify(body), JSON.stringify(query), api_id, token_id]
    );    

    console.log(`📝 API Log Created - Request No: ${logResult.rows[0].id}`);
    return logResult.rows[0].id; // Return request number
  } catch (error) {
    console.error("🚨 Error logging API request:", error);
    return null;
  }
};
