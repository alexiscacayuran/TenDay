import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/tenday/issuance", async (req, res) => {
  try {
    // ✅ Query latest start_date
    const dateQuery = `SELECT MAX(start_date) AS start_date FROM date`;
    const dateResult = await pool.query(dateQuery);

    if (!dateResult.rows.length || !dateResult.rows[0].start_date) {
      return res.status(404).json({ message: "No valid date found" });
    }

    // Convert to Manila Time
    let rawStart = new Date(dateResult.rows[0].start_date);
    const manilaStart = new Date(rawStart.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    // Compute end_date: start + 9 days
    const manilaEnd = new Date(manilaStart);
    manilaEnd.setDate(manilaEnd.getDate() + 9);

    const formatOptions = { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" };
    const formattedStart = new Intl.DateTimeFormat("en-CA", formatOptions).format(manilaStart); // YYYY-MM-DD
    const formattedEnd = new Intl.DateTimeFormat("en-CA", formatOptions).format(manilaEnd);     // YYYY-MM-DD

    // Format for filename: MMDDYYYY (for day10.csv lookup)
    const filenameDate = `${(manilaEnd.getMonth() + 1).toString().padStart(2, "0")}${manilaEnd.getDate().toString().padStart(2, "0")}${manilaEnd.getFullYear()}`;

    // ✅ Query latest time for day10.csv
    const logQuery = `
      SELECT TO_CHAR(logdate, 'HH12:MI:SS AM') AS formatted_time 
      FROM activity_log 
      WHERE file_name LIKE $1 
      ORDER BY logdate DESC 
      LIMIT 1
    `;
    const logResult = await pool.query(logQuery, [`%${filenameDate}(day10.csv)%`]);

    let latestTime = null;
    if (logResult.rows.length > 0) {
      latestTime = logResult.rows[0].formatted_time;
    }

    // ✅ Final response
    const data = {
      latest_date: formattedStart,
      latest_time: latestTime,
      start_date: formattedStart,
      end_date: formattedEnd
    };

    res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
