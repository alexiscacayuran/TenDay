import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto"; 
import { pool } from "../db.js";
//import nodemailer from "nodemailer"; // Keep nodemailer as commented

const router = express.Router();
const SECRET_KEY = process.env.jwtSecret;

/*
|-------------------------------------------------------------------------- 
| Encrypt / Decrypt using AES-256
|-------------------------------------------------------------------------- 
*/
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest();

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText) {
  const [ivHex, content] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest();

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  let decrypted = decipher.update(content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/*
|-------------------------------------------------------------------------- 
| Deterministic hash (for lookup only)
|-------------------------------------------------------------------------- 
*/
function makeTokenHash(rawToken) {
  return crypto.createHmac("sha256", SECRET_KEY).update(rawToken).digest("hex");
}

router.post("/generate-token", async (req, res) => {
  const { organization, email, expires_in, api_ids } = req.body;

  if (!SECRET_KEY) {
    return res.status(500).json({ error: "jwtSecret is not set" });
  }

  if (!organization || !email || !Array.isArray(api_ids) || api_ids.length === 0) {
    return res.status(400).json({ error: "Organization, email, and at least one API ID are required" });
  }

  try {
    const orgExists = await pool.query(
      "SELECT 1 FROM api_tokens WHERE organization = $1",
      [organization]
    );
    if (orgExists.rowCount > 0) {
      return res.status(409).json({ error: "Organization is already recorded" });
    }

    const emailExists = await pool.query(
      "SELECT 1 FROM api_tokens WHERE email = $1",
      [email]
    );
    if (emailExists.rowCount > 0) {
      return res.status(409).json({ error: "Email is already recorded" });
    }

    const apiCheckQuery = "SELECT id FROM api WHERE id = ANY($1)";
    const apiCheckResult = await pool.query(apiCheckQuery, [api_ids]);

    const validApiIds = apiCheckResult.rows.map(row => row.id);

    if (validApiIds.length !== api_ids.length) {
      return res.status(400).json({ error: "One or more API IDs are invalid" });
    }

    let expires_at = null;
    let tokenPayload = { organization, email, api_ids: validApiIds };

    if (expires_in && expires_in !== "lifetime") {
      const expirationTime = Math.floor(Date.now() / 1000) + parseInt(expires_in, 10);
      tokenPayload.exp = expirationTime;
      expires_at = new Date(expirationTime * 1000).toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        hour12: true,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // ✅ Generate JWT Token (RAW token)
    const token = jwt.sign(tokenPayload, SECRET_KEY);

    // ✅ Encrypt token for storage in DB
    const encryptedToken = encrypt(token);

    // ✅ Deterministic lookup hash (token_hash)
    const token_hash = makeTokenHash(token);

    // ✅ Insert encrypted token and token_hash
    const insertQuery = `
      INSERT INTO api_tokens (token, token_hash, organization, email, expires_at, created_at, api_ids) 
      VALUES ($1, $2, $3, $4, $5, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'), $6)
      RETURNING id
    `;
    const values = [encryptedToken, token_hash, organization, email, expires_at, validApiIds];
    await pool.query(insertQuery, values);

    /** 
    // ✅ Send RAW token via email (user must receive raw token)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tenday.pagasa@gmail.com",
        pass: "lnio apew yaup fqds",
      },
    });

    await transporter.sendMail({
      from: `"TenDay" <tenday.pagasa@gmail.com>`,
      to: email,
      subject: "Your API Access Token",
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <h2 style="color: #2b6777;">🔐 API Access Token</h2>
          <p>Hello <strong>${organization}</strong>,</p>
          <p>Thank you for registering to access our API services. Below is your generated API token:</p>

          <div style="background-color: #eaf6f6; padding: 15px; border-left: 5px solid #2b6777; margin: 20px 0; border-radius: 5px;">
            <p style="font-size: 14px; word-break: break-all;"><strong>Token:</strong><br>${token}</p>
          </div>

          ${expires_at
            ? `<p><strong>Expiration:</strong> ${expires_at}</p>`
            : `<p><strong>This token has lifetime access.</strong></p>`}

          <p>Please <a href="https://tenday.pagasa.dost.gov.ph/api/v1/validate?token=${token}">click here to activate your token</a>.</p>
          <p>You may also <a href="https://tenday.pagasa.dost.gov.ph/docs">click this to see the full API documentation</a>.</p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="font-size: 12px; color: #777;">If you did not request this token, please ignore this email or contact support immediately.</p>
          <p style="font-size: 12px; color: #777;">⚠️ Please do not reply to this email as it was sent automatically and is not monitored.</p>
        </div>

        <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
          &copy; ${new Date().getFullYear()} API Services | TenDay
        </p>
      </div>
      `,
    });
    */

    return res.json({ token, expires_at });
  } catch (error) {
    console.error("❌ Error generating token", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;