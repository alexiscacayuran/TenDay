import express from "express";
import { pool } from "../db.js";
import nodemailer from "nodemailer";

const router = express.Router();

// 📬 Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'gabrielbesmontelopez100900@gmail.com',
    pass: 'qjrf fjcg ytqh btwe',
  },
});

router.post("/mark-solved/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // 1. Fetch feedback entry
    const result = await pool.query(
      "SELECT email, comment FROM feedback WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    const { email, comment } = result.rows[0];

    // 2. Set status to 0
    await pool.query("UPDATE feedback SET status = 0 WHERE id = $1", [id]);

    // 3. Send email if email exists
    if (email) {
      const paddedId = String(id).padStart(4, '0');
      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #2b6777;">✅ Case Resolved</h2>
          <p>Hello,</p>
          <p>Your feedback with <strong>Case ID: #${paddedId}</strong> has been marked as <strong>solved</strong>.</p>
          ${comment ? `
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>Your original comment:</strong>
              <p style="margin: 5px 0;">"${comment}"</p>
            </div>
          ` : ''}
          <p>Thank you for your input. We appreciate your help in improving our services.</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">TenDay Support Team</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"TenDay" <gabrielbesmontelopez100900@gmail.com>`,
        to: email,
        subject: `Your Case ID: #${paddedId} is marked as solved`,
        html: htmlMessage,
      });
    }

    return res.json({ success: true, message: "Status updated. Email sent if applicable." });

  } catch (error) {
    console.error("❌ Error processing feedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
