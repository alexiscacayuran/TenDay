// cleanUpS3.js
import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

import s3 from "../aws.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Asia/Manila";
const KEEP_DAYS = 8;         // delete if age >= 8 days (except latest folder)
const MAX_DELETE = 1000;     // S3 DeleteObjects limit per request
const DRY_RUN = false;       // set true to test without deleting

const BUCKET_NAME = process.env.BUCKET_NAME;
if (!BUCKET_NAME) {
  throw new Error("BUCKET_NAME is not set. Please set process.env.BUCKET_NAME");
}

// ---- Helpers ----
async function listAllTopLevelFolders() {
  const prefixes = [];
  let token = undefined;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Delimiter: "/", // list "folders"
        ContinuationToken: token,
      })
    );

    if (res.CommonPrefixes?.length) {
      prefixes.push(...res.CommonPrefixes);
    }

    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return prefixes;
}

async function listAllKeysUnderPrefix(prefix) {
  const keys = [];
  let token = undefined;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );

    if (res.Contents?.length) {
      for (const obj of res.Contents) {
        if (obj.Key) keys.push(obj.Key);
      }
    }

    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return keys;
}

async function deleteKeysInBatches(keys) {
  for (let i = 0; i < keys.length; i += MAX_DELETE) {
    const batch = keys.slice(i, i + MAX_DELETE);

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  }
}

// ---- Main ----
async function cleanUpExpiredFolders() {
  try {
    console.log(
      `🔎 S3 cleanup check started | bucket=${BUCKET_NAME} | keepDays=${KEEP_DAYS} | tz=${TZ} | dryRun=${DRY_RUN}`
    );

    const today = dayjs().tz(TZ).startOf("day");

    // 1) List folders (prefixes) with pagination
    const prefixes = await listAllTopLevelFolders();
    if (!prefixes.length) {
      console.log("No folders found.");
      return;
    }

    // 2) Extract YYYYMMDD folders
    const validFolders = prefixes
      .map((f) => (f.Prefix || "").replace("/", "")) // "20260130/"
      .filter((name) => /^\d{8}$/.test(name))
      .map((name) => ({
        name,
        date: dayjs.tz(name, "YYYYMMDD", TZ).startOf("day"),
      }))
      .filter((f) => f.date.isValid())
      .sort((a, b) => a.date.diff(b.date)); // oldest -> newest

    if (validFolders.length === 0) {
      console.log("No valid YYYYMMDD folders found.");
      return;
    }

    if (validFolders.length <= 1) {
      console.log("Only one valid folder found — skipping deletion.");
      return;
    }

    const latestFolder = validFolders[validFolders.length - 1].name;

    // 3) Delete checker log
    console.log("📌 Delete checker (folder | age_days | latest | eligible_on | action)");
    for (const { name, date } of validFolders) {
      const ageDays = today.diff(date, "day");
      const eligibleOn = date.add(KEEP_DAYS, "day").format("YYYY-MM-DD");
      const isLatest = name === latestFolder;
      const eligible = !isLatest && ageDays >= KEEP_DAYS;

      console.log(
        `${name} | ${ageDays} | ${isLatest} | >=${eligibleOn} | ${eligible ? "DELETE" : "KEEP"}`
      );
    }

    // 4) Delete eligible folders
    for (const { name: folderName, date: folderDate } of validFolders) {
      if (folderName === latestFolder) continue;

      const ageDays = today.diff(folderDate, "day");
      if (ageDays < KEEP_DAYS) continue;

      const prefix = `${folderName}/`;
      const keys = await listAllKeysUnderPrefix(prefix);

      if (!keys.length) {
        console.log(`ℹ️ Folder ${folderName} has no objects (nothing to delete).`);
        continue;
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would delete folder ${folderName} (${keys.length} objects).`);
        continue;
      }

      console.log(`🧹 Deleting folder: ${folderName} (${keys.length} objects)...`);
      await deleteKeysInBatches(keys);
      console.log(`✅ Folder ${folderName} deleted.`);
    }
  } catch (err) {
    console.error("❌ Error cleaning up S3 folders:", err);
  }
}

// ---- Schedule: every day at 02:00 PM Manila ----
cron.schedule(
  "0 14 * * *",
  () => {
    console.log(" ====================================================");
    console.log("                   🕘 BUCKET CLEANUP");
    console.log(" ====================================================");
    console.log("     🕘 Running S3 cleanup at 2:00 PM Manila time");
    cleanUpExpiredFolders();
  },
  { timezone: TZ }
);

export { cleanUpExpiredFolders };
