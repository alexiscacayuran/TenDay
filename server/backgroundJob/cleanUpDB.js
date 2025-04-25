import cron from "node-cron";
import { pool } from "../db.js";
import Redis from 'ioredis';
const redis = new Redis();

// Function to delete expired records based on start_date + 6 days
async function deleteOldRecords() {
  try {
    // Delete from dependent table first
    await pool.query(`
      DELETE FROM rainfall
      WHERE date_id IN (
        SELECT id FROM date
        WHERE start_date + interval '6 days' <= CURRENT_DATE
      );
    `);

    // Then delete from date table
    const result = await pool.query(`
      DELETE FROM date
      WHERE start_date + interval '6 days' <= CURRENT_DATE;
    `);

    console.log(`✅ Deleted ${result.rowCount} expired records from date table.`);
  } catch (err) {
    console.error("❌ Error deleting old records:", err);
  }
}

// Schedule at 6:00 AM UTC = 2:00 PM Manila (UTC+8)
cron.schedule("0 6 * * *", () => {
  console.log("🕙 Running scheduled cleanup task...");
  deleteOldRecords();
});

// Export if needed elsewhere
export { deleteOldRecords };
