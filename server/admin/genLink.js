import express from 'express';
import { randomUUID } from 'crypto';
import { pool } from '../db.js';
import nodemailer from 'nodemailer';

const router = express.Router();

const POWER_BI_URL =
  'https://app.powerbi.com/view?r=eyJrIjoiMDhjM2JiM2UtMjI0Ni00ZGM0LThmODYtMGIyOTEwMGJiNDRlIiwidCI6ImIzN2NiMTliLTNjMzAtNGJhNi1hNWE5LWUxYzViNTJjODMwMiIsImMiOjEwfQ%3D%3D&navContentPaneEnabled=false&filterPaneEnabled=false&$fitToPage=true';

const BASE_URL = 'http://tenday.pagasa.dost.gov.ph:3030/easitool';
//const EXPIRE_SECONDS = 10800; //3 Hours
const EXPIRE_SECONDS = 60; //3 Hours

// Setup email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tenday.pagasa@gmail.com',
    pass: 'lnio apew yaup fqds',
  }
});

// 👉 GET form status (React calls this before rendering form)
router.get('/form-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT form_open FROM form_status LIMIT 1');
    res.json({ formOpen: result.rows[0]?.form_open });
  } catch (err) {
    console.error('Form status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 👉 POST: generate and email link
router.post('/generate-link', async (req, res) => {
  const { name, organization, email } = req.body;

  // Check if form is open
  const statusResult = await pool.query('SELECT form_open FROM form_status LIMIT 1');
  if (!statusResult.rows[0]?.form_open) {
    return res.status(403).json({ error: 'Form is currently closed' });
  }

  if (!name || !organization || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + EXPIRE_SECONDS * 1000);
  const link = `${BASE_URL}/${token}`;

  try {
    await pool.query(
      `INSERT INTO presigned_links (name, organization, email, token, link, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, organization, email, token, link, expiresAt]
    );

    // ✉️ Send email
    await transporter.sendMail({
      from: `"EASi Tool" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Your EASi Tool Access Link',
        html: `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #f9f9f9;">
    <div style="background: #0066cc; padding: 20px; color: white; text-align: center;">
      <h2 style="margin: 0;">EASi Tool Access Link</h2>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size: 15px; color: #333;">
        Thank you for requesting access. Click the secure link below to access the <strong>EASi Tool</strong>:
      </p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Access EASi Tool
        </a>
      </div>
      <p style="font-size: 14px; color: #555;">
        Or you can copy and paste this link into your browser:
        <br />
        <a href="${link}" style="color: #0066cc;">${link}</a>
      </p>
      <p style="font-size: 13px; color: #999; margin-top: 30px;">
        ⚠️ This link will expire in <strong>3 hours</strong> for your security.
      </p>
    </div>
    <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #999;">
      Please do not reply to this email. For assistance, contact your system administrator.
    </div>
  </div>
      `
    });

    res.json({ success: true, link });
  } catch (err) {
    console.error('DB/email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 👉 GET: iframe rendering
router.get('/view/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM presigned_links WHERE token = $1 AND expires_at > now()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(403).send('<h2>Link expired or invalid.</h2>');
    }

    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>EASi Tool</title></head>
        <body style="margin:0;padding:0;height:100vh;">
          <iframe
            title="EASi Tool"
            width="100%"
            height="100%"
            src="${POWER_BI_URL}"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('DB fetch error:', err);
    res.status(500).send('Server error');
  }
});

// 👉 React validation check
router.get('/api/check-token/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM presigned_links WHERE token = $1`, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, reason: 'Invalid token' });
    }

    const isExpired = new Date(result.rows[0].expires_at) < new Date();

    if (isExpired) {
      return res.json({ valid: false, reason: 'Token expired' });
    }

    res.json({ valid: true, expiresAt: result.rows[0].expires_at });
  } catch (err) {
    console.error('DB check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
