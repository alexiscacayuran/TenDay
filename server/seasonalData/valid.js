import express from "express";
import { pool } from "../db.js";
import { format } from "date-fns";

const router = express.Router();

router.get("/issuance", async (req, res) => {
  try {
    // Get the latest batch
    const batchRes = await pool.query(`SELECT MAX(batch) AS latest_batch FROM sf_date`);
    const latestBatch = batchRes.rows[0]?.latest_batch;

    // Get latest_date (1 month before min date in batch)
    const dateRes = await pool.query(`
      SELECT MIN(date) - INTERVAL '1 month' AS latest_date  
      FROM sf_date  
      WHERE batch = $1
    `, [latestBatch]);

    // Get raw start and end dates for formatting
    const rangeRes = await pool.query(`
      SELECT 
        MIN(date) AS start_date,
        MAX(date) AS end_date
      FROM sf_date
      WHERE batch = $1
    `, [latestBatch]);

    // Get latest log time
    const timeRes = await pool.query(`
      SELECT MAX(logdate) AS latest_time 
      FROM activity_log 
      WHERE forecast = 'Seasonal Forecast'
    `);

    const latestDateObj = dateRes.rows[0]?.latest_date;
    const latestTimeObj = timeRes.rows[0]?.latest_time;
    const startDateObj = rangeRes.rows[0]?.start_date;
    const endDateObj = rangeRes.rows[0]?.end_date;

    // Format all dates as "YYYY-MM"
    const latestDate = latestDateObj ? format(new Date(latestDateObj), "yyyy-MM") : null;
    const latestTime = latestTimeObj ? format(new Date(latestTimeObj), "hh:mm:ss a") : null;
    const startDate = startDateObj ? format(new Date(startDateObj), "yyyy-MM") : null;
    const endDate = endDateObj ? format(new Date(endDateObj), "yyyy-MM") : null;

    res.json({
      latest_batch: latestBatch?.toString() || null,
      latest_date: latestDate,
      latest_time: latestTime,
      start_date: startDate,
      end_date: endDate
    });
  } catch (err) {
    console.error("Error fetching seasonal valid info:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
