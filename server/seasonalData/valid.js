import express from "express";
import { pool } from "../db.js";
import { format } from "date-fns";

const router = express.Router();

router.get("/valid", async (req, res) => {
  try {
    const dateRes = await pool.query(`SELECT TO_CHAR(MIN(date) - INTERVAL '1 month', 'YYYY-MM') AS latest_date  FROM sf_date  WHERE batch = (SELECT MAX(batch) FROM sf_date)`);
    const batchRes = await pool.query(`SELECT MAX(batch) AS latest_batch FROM sf_date`);
    const timeRes = await pool.query(`SELECT MAX(logdate) AS latest_time FROM activity_log WHERE forecast = 'Seasonal Forecast'`);

    const latestDateObj = dateRes.rows[0]?.latest_date;
    const latestBatch = batchRes.rows[0]?.latest_batch;
    const latestTimeObj = timeRes.rows[0]?.latest_time;

    const latestDate = latestDateObj ? format(new Date(latestDateObj), "yyyy-MM") : null;
    const latestTime = latestTimeObj ? format(new Date(latestTimeObj), "hh:mm:ss a") : null;

    res.json({
      latest_batch: latestBatch?.toString() || null,
      latest_date: latestDate,
      latest_time: latestTime
    });
  } catch (err) {
    console.error("Error fetching seasonal valid info:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
