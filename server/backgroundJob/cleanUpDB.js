import cron from "node-cron";
import { pool } from "../db.js";
import Redis from "ioredis";

const redis = new Redis();

async function deleteOldRecords() {
  try {
    // Step 1: Get all distinct start_dates
    const allStartDatesResult = await pool.query(`
      SELECT DISTINCT start_date
      FROM date
    `);
    const allStartDates = allStartDatesResult.rows.map(row => row.start_date);

    // If only one start_date exists, skip deletion
    if (allStartDates.length <= 1) {
      console.log("ℹ️ Only one start_date in the system. Skipping deletion to preserve minimum data.");
      return;
    }

    // Step 2: Get the latest start_date
    const latestDateResult = await pool.query(`
      SELECT MAX(start_date) as latest_date
      FROM date
    `);
    const latestDate = latestDateResult.rows[0].latest_date;

    // Step 3: Find expired start_dates (older than 7 days and not the latest one)
    const expiredStartDatesResult = await pool.query(`
      SELECT start_date
      FROM date
      WHERE start_date + interval '7 days' <= CURRENT_DATE
        AND start_date <> $1
      GROUP BY start_date
    `, [latestDate]);

    const deletableStartDates = expiredStartDatesResult.rows.map(row => row.start_date);

    if (deletableStartDates.length === 0) {
      console.log("ℹ️ No eligible expired start_dates found for deletion.");
      return;
    }

    // Step 4: Delete from date table — all related data will be deleted via ON DELETE CASCADE
    const deleteResult = await pool.query(`
      DELETE FROM date
      WHERE start_date = ANY($1)
    `, [deletableStartDates]);

    console.log(`✅ Deleted ${deleteResult.rowCount} expired record(s) from date table (and cascaded related data).`);
  } catch (err) {
    console.error("❌ Error deleting old records:", err);
  }
}

// Schedule the cleanup task to run every day at 6:00 AM UTC (2:00 PM Manila)
cron.schedule("0 14 * * *", () => {
  console.log("🕑 Running cron at 2:00 PM Manila time");
  deleteOldRecords();
}, {
  timezone: "Asia/Manila"
});


export { deleteOldRecords };
