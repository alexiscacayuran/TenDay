import { pool } from '../db.js';

// ✅ Authenticate API Token by DB lookup (no JWT decode)
export const authenticateToken = async (req, res, next) => {
  const token = req.headers["token"];

  console.log("🔍 Received Token:", token);

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  try {
    // Pull organization and api_ids from the database
    const result = await pool.query(
      `SELECT organization, expires_at, api_ids FROM api_tokens WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      console.log("❌ Token not found in database");
      return res.status(401).json({ error: "Unauthorized! Invalid token." });
    }

    const { organization, expires_at, api_ids } = result.rows[0];

    if (expires_at && new Date(expires_at) < new Date()) {
      console.log("⏰ Token expired");
      return res.status(403).json({ error: "Token expired" });
    }

    req.user = {
      organization,
      api_ids: Array.isArray(api_ids) ? api_ids : []  // Ensure it's an array
    };

    console.log("✅ Token authenticated for:", organization);
    next();
  } catch (error) {
    console.error("🚨 DB error during token validation:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
