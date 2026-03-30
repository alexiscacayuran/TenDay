import crypto from "crypto";
import { pool } from "../db.js";

const SECRET_KEY = process.env.jwtSecret;

export const ipWhitelist = async (req, res, next) => {
  try {
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";

    const cleanIp = clientIp.replace("::ffff:", "");
    console.log("IP address: ", cleanIp);

    const hashedIp = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(cleanIp)
      .digest("hex");

    const result = await pool.query(
      `SELECT 1 FROM ip WHERE ip_address = $1 LIMIT 1`,
      [hashedIp]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        error: "Access denied. Your IP is not allowed.",
      });
    }

    next();
  } catch (error) {
    console.error("IP whitelist error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
