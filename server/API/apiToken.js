import express from "express";
import crypto from "crypto";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logApiRequest } from "../middleware/logMiddleware.js";
import { ipWhitelist } from "../middleware/ipWhitelist.js";

const router = express.Router();
const SECRET_KEY = process.env.jwtSecret;

/*
|---------------------------------------------------------------------------
| AES-256 Decrypt
|---------------------------------------------------------------------------
*/
function decrypt(encryptedText) {
  try {
    if (!encryptedText) return "(Old token)";

    if (!encryptedText.includes(":")) return "(Old token)";

    const [ivHex, content] = encryptedText.split(":");
    if (!ivHex || ivHex.length !== 32) return "(Old token)";

    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.createHash("sha256").update(SECRET_KEY).digest();

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(content, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Token decrypt failed → old format");
    return "(Old token)";
  }
}

/*
|---------------------------------------------------------------------------
| Mask token for safe UI display
|---------------------------------------------------------------------------
*/
function maskToken(token) {
  if (!token) return null;
  return token.slice(0, 8) + "••••••••••••••••" + token.slice(-6);
}

/*
|---------------------------------------------------------------------------
| 🔐 PROTECTED ROUTE - List Tokens
|---------------------------------------------------------------------------
*/
router.get(
  "/list-tokens",
    ipWhitelist,          // IP checker
  authenticateToken(15), // Pass the API ID for permission check
  async (req, res) => {
    try {
      const showFull = req.query.show_full === "true";

      // Log the API request
      await logApiRequest(req, 15); // Pass the API ID

      const result = await pool.query(
        `SELECT id, organization, token, api_ids, email, status, expires_at
         FROM api_tokens
         WHERE id <> 1
         ORDER BY id ASC`
      );

      const tokens = result.rows.map((row) => {
        const decryptedToken = decrypt(row.token);
        return {
          id: row.id,
          organization: row.organization,
          token: showFull ? decryptedToken : maskToken(decryptedToken),
          api_ids: row.api_ids,
          email: row.email,
          status: row.status,
          expires_at: row.expires_at,
        };
      });

      res.json({
        count: tokens.length,
        data: tokens,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;
