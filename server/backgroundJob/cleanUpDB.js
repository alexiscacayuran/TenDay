import cron from "node-cron";
import { pool } from "../db.js"; // Import the database connection
import Redis from 'ioredis';  // Import Redis client
const redis = new Redis();  // Create Redis client

// Function to delete expired records based on start_date + 3 days
async function deleteOldRecords() {
  try {
    // Delete dependent rows in rainfall first
    await pool.query(`
      DELETE FROM rainfall
      WHERE date_id IN (
        SELECT id FROM date
        WHERE start_date + interval '3 days' <= CURRENT_DATE
      );
    `);

    // Then delete expired records from the date table
    const result = await pool.query(`
      DELETE FROM date
      WHERE start_date + interval '3 days' <= CURRENT_DATE;
    `);

    console.log(`✅ Deleted ${result.rowCount} expired records from date table.`);
  } catch (err) {
    console.error("❌ Error deleting old records:", err);
  }
}


cron.schedule("59 15 * * *", () => {
    console.log("🕙 Running scheduled cleanup task...");
    deleteOldRecords();
  });
  

// Export the function if needed elsewhere
export { deleteOldRecords };
