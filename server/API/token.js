import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import nodemailer from "nodemailer";

const router = express.Router();
const SECRET_KEY = process.env.jwtSecret;

router.post("/generate-token", async (req, res) => {
  const { organization, email, expires_in, api_ids } = req.body;

  if (!organization || !email || !Array.isArray(api_ids) || api_ids.length === 0) {
    return res.status(400).json({ error: "Organization, email, and at least one API ID are required" });
  }

  try {
    // 🔍 Check if organization already exists
    const orgExists = await pool.query(
      "SELECT 1 FROM api_tokens WHERE organization = $1",
      [organization]
    );
    if (orgExists.rowCount > 0) {
      return res.status(409).json({ error: "Organization is already recorded" });
    }

    // 🔍 Check if email already exists
    const emailExists = await pool.query(
      "SELECT 1 FROM api_tokens WHERE email = $1",
      [email]
    );
    if (emailExists.rowCount > 0) {
      return res.status(409).json({ error: "Email is already recorded" });
    }

    // ✅ Validate API IDs
    const apiCheckQuery = "SELECT id FROM api WHERE id = ANY($1)";
    const apiCheckResult = await pool.query(apiCheckQuery, [api_ids]);

    const validApiIds = apiCheckResult.rows.map(row => row.id);

    if (validApiIds.length !== api_ids.length) {
      return res.status(400).json({ error: "One or more API IDs are invalid" });
    }

    // ✅ Set expiration time (if provided)
    let expires_at = null;
    let tokenPayload = { organization, email, api_ids };

    if (expires_in && expires_in !== "lifetime") {
      const expirationTime = Math.floor(Date.now() / 1000) + parseInt(expires_in, 10);
      tokenPayload.exp = expirationTime;
      expires_at = new Date(expirationTime * 1000).toLocaleString('en-US', { 
        timeZone: 'Asia/Manila', 
        hour12: true, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(tokenPayload, SECRET_KEY);

    // ✅ Insert token into database
    const insertQuery = `
      INSERT INTO api_tokens (token, organization, email, expires_at, created_at, api_ids) 
      VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING token
    `;
    const values = [token, organization, email, expires_at, validApiIds];  
    const result = await pool.query(insertQuery, values);
    const createdToken = result.rows[0].token;

    // ✅ Send token via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: 'gabrielbesmontelopez100900@gmail.com',
        pass: 'qjrf fjcg ytqh btwe',
      },
    });

    await transporter.sendMail({
      from: `"TenDay" <${'gabrielbesmontelopez100900@gmail.com'}>`,
      to: email,
      subject: "Your API Access Token",
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <h2 style="color: #2b6777;">🔐 API Access Token</h2>
          <p>Hello <strong>${organization}</strong>,</p>
          <p>Thank you for registering to access our API services. Below is your generated API token:</p>
          
          <div style="background-color: #eaf6f6; padding: 15px; border-left: 5px solid #2b6777; margin: 20px 0; border-radius: 5px;">
            <p style="font-size: 14px; word-break: break-all;"><strong>Token:</strong><br>${createdToken}</p>
          </div>
    
          ${expires_at 
            ? `<p><strong>Expiration:</strong> ${expires_at}</p>` 
            : `<p><strong>This token has lifetime access.</strong></p>`}
    
          <p>Please store this token securely. It is used to authenticate your API requests.</p>
    
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
          <p style="font-size: 12px; color: #777;">If you did not request this token, please ignore this email or contact support immediately.</p>
        </div>
    
        <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
          &copy; ${new Date().getFullYear()} API Services | TanawPH
        </p>
      </div>
    `,    
    });

    return res.json({ token: createdToken, expires_at });

  } catch (error) {
    console.error("❌ Error generating token", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
