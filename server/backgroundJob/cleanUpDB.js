// cleanUpDB.js
import cron from "node-cron";
import { pool } from "../db.js";

const KEEP_DAYS = 7;
const BATCH_SIZE = 10;

// Any constant integer (unique-ish for your app)
const ADVISORY_LOCK_KEY = 987654321;

// Optional
const STATEMENT_TIMEOUT_MS = 60_000; // 60 seconds

async function deleteOldRecords() {
  const client = await pool.connect();

  try {
    // Only one instance/process runs this at a time
    const lockRes = await client.query(
      `SELECT pg_try_advisory_lock($1) AS locked`,
      [ADVISORY_LOCK_KEY]
    );

    if (!lockRes.rows?.[0]?.locked) {
      console.log("ℹ️ Cleanup skipped: another instance is already running it.");
      return;
    }

    await client.query("BEGIN");

    // ✅ FIX: SET LOCAL cannot use $1 placeholders
    // If you don't want it, you can delete this line.
    await client.query(`SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}ms'`);

    // Step A: distinct start_dates
    const allStartDatesResult = await client.query(`
      SELECT DISTINCT start_date
      FROM date
    `);
    const allStartDates = allStartDatesResult.rows.map((r) => r.start_date);

    if (allStartDates.length <= 1) {
      console.log("ℹ️ Only one start_date in the system. Skipping deletion to preserve minimum data.");
      await client.query("COMMIT");
      return;
    }

    // Step B: latest start_date
    const latestDateResult = await client.query(`
      SELECT MAX(start_date) AS latest_date
      FROM date
    `);
    const latestDate = latestDateResult.rows[0]?.latest_date;

    if (!latestDate) {
      console.log("ℹ️ No latest_date found. Skipping.");
      await client.query("COMMIT");
      return;
    }

    // Step C: find deletable start_dates (batched)
    const expiredStartDatesResult = await client.query(
      `
      SELECT start_date
      FROM date
      WHERE start_date + ($2::int * interval '1 day') <= CURRENT_DATE
        AND start_date <> $1
      GROUP BY start_date
      ORDER BY start_date
      LIMIT $3
      `,
      [latestDate, KEEP_DAYS, BATCH_SIZE]
    );

    const deletableStartDates = expiredStartDatesResult.rows.map((r) => r.start_date);

    if (deletableStartDates.length === 0) {
      console.log("ℹ️ No eligible expired start_dates found for deletion.");
      await client.query("COMMIT");
      return;
    }

    // Step D: delete (cascades)
    const deleteResult = await client.query(
      `
      DELETE FROM date
      WHERE start_date = ANY($1::date[])
      `,
      [deletableStartDates]
    );

    await client.query("COMMIT");

    console.log(
      `✅ Deleted ${deleteResult.rowCount} start_date row(s) (and cascaded related data). ` +
      `Batch size=${BATCH_SIZE}, keepDays=${KEEP_DAYS}`
    );
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("❌ Rollback failed:", rollbackErr);
    }
    console.error("❌ Error deleting old records:", err);
  } finally {
    // release lock + release connection
    try {
      await client.query(`SELECT pg_advisory_unlock($1)`, [ADVISORY_LOCK_KEY]);
    } catch (unlockErr) {
      console.error("⚠️ Failed to unlock advisory lock:", unlockErr);
    }
    client.release();
  }
}
// Runs every day at 2:00 PM Manila time
/** 
cron.schedule(
  "0 14 * * *",
  () => {
    console.log("🕑 Running cleanup cron at 2:00 PM Manila time");
    deleteOldRecords();
  },
  { timezone: "Asia/Manila" }
);

export { deleteOldRecords };
*/

cron.schedule(
  "0 14 * * *",
  () => {
    console.log(" ====================================================");
    console.log("                   🕘 DATABASE CLEANUP");
    console.log(" ====================================================");
    console.log("         🕘 Running cron at 2:00 PM Manila time");
    deleteOldRecords();
  },
  { timezone: "Asia/Manila" }
);
