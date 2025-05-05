import express from "express";
import { pool, redisClient } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const cacheKey = "latestValidDateTime";

  try {
    // Check Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("✅ Cache hit - Returning latest date and time from Redis");
      return res.json(JSON.parse(cachedData));
    }

    // ✅ Query latest date from DB (Make sure it's in Manila Time)
    const dateQuery = `SELECT MAX(start_date) as latest_date FROM date`;
    const dateResult = await pool.query(dateQuery);

    if (!dateResult.rows.length || !dateResult.rows[0].latest_date) {
      return res.status(404).json({ message: "No valid date found" });
    }

    // ✅ Convert UTC date from DB to Manila Time
    let latestDate = new Date(dateResult.rows[0].latest_date);

    // ✅ Force conversion to Manila Time
    latestDate = new Date(latestDate.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

  

    // ✅ Format as YYYY-MM-DD (Manila Time)
    const options = { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" };
    const formattedDate = new Intl.DateTimeFormat("en-CA", options).format(latestDate);

    console.log("✅ Latest Date in Manila Time:", formattedDate); // Should be 2025-03-26

    // ✅ Correct the day10 target date (March 26 is Day 1, so add **9 days**)
    latestDate.setDate(latestDate.getDate() + 9);
    const datePart = `${(latestDate.getMonth() + 1).toString().padStart(2, "0")}${latestDate.getDate().toString().padStart(2, "0")}${latestDate.getFullYear()}`;

    console.log("✅ Target Date for day10.csv:", datePart); // Should be 04042025

    // ✅ Query latest time from activity_log for `day10.csv`
    const logQuery = `
    SELECT TO_CHAR(logdate, 'HH12:MI:SS AM') AS formatted_time 
    FROM activity_log 
    WHERE file_name LIKE $1 
    ORDER BY logdate DESC 
    LIMIT 1
  `;
  
  const logResult = await pool.query(logQuery, [`%${datePart}(day10.csv)%`]);
  
  let latestTime = null;
  if (logResult.rows.length > 0) {
    latestTime = logResult.rows[0].formatted_time; // Already formatted in SQL
  }
  
  

    // ✅ Final JSON response
    const data = { latest_date: formattedDate, latest_time: latestTime };

    // ✅ Store result in Redis cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(data), "EX", 3600);

    console.log("❌ Cache miss - Fetching latest date and time from database");
    res.json(data);
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
