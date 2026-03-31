import fs from "fs-extra";
import path from "path";
import moment from "moment";
import s3 from "../aws.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import gdal from "gdal-async";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chalk from "chalk";

const TEMP_DIR = "./tif";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const geojsonPath = join(__dirname, "country_lowres_dissolved.geojson");

const log = console.log;

// 🧹 cleanup temp files
const deleteTempFiles = async () => {
  try {
    if (fs.existsSync(TEMP_DIR)) {
      const files = await fs.readdir(TEMP_DIR);
      await Promise.all(
        files.map((f) => fs.unlink(path.join(TEMP_DIR, f)))
      );
      console.log("Deleted all temp files.");
    }
  } catch (err) {
    console.error("Error deleting temp files:", err);
  }
};

// 🔁 SAFE upload with retry
const uploadWithRetry = async (params, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await s3.send(new PutObjectCommand(params));
      return;
    } catch (err) {
      console.error(`Upload attempt ${attempt} failed`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
};

/**
 * 🔥 ORIGINAL MODE
 * - upload original tif
 * - clip only (no COG)
 */
const maskTifOriginal = async (targetFilePath, outputFileName) => {
  if (!fs.existsSync(targetFilePath)) {
    console.log(`File ${targetFilePath} not found`);
    return null;
  }

  try {
    gdal.config.set("GDAL_PAM_ENABLED", "NO");

    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR);
    }

    const origPath = path.join(TEMP_DIR, `${outputFileName}_orig.tif`);
    const maskedPath = path.join(
      TEMP_DIR,
      `${outputFileName}_masked_orig.tif`
    );

    // ✅ copy original
    await fs.copy(targetFilePath, origPath);

    log(
      chalk.bgGreen("Original copied → ") +
        chalk.yellow(origPath)
    );

    // ✅ open dataset (REQUIRED)
    const srcDataset = await gdal.openAsync(origPath, "r");

    // ✅ clip original
    await gdal.warpAsync(
      maskedPath,
      null,
      [srcDataset],
      [
        "-cutline",
        geojsonPath,
        "-crop_to_cutline",
        "-co",
        "TILED=YES",
        "-co",
        "COMPRESS=DEFLATE",
      ]
    );

    srcDataset.close();

    log("Original clipped successfully: " + chalk.yellow(maskedPath));

    return { origPath, maskedPath };
  } catch (error) {
    console.error("Error processing original file.", error);
    return null;
  }
};

// 🚀 MAIN
export const uploadForecastTIF_orig = async (year, month, day) => {
  const SOURCE_PATH = "\\\\10.10.3.118\\climps\\10_Day\\Data";
  const BUCKET_NAME = "tendayforecast";

  const processFolder = async (year, month, day) => {
    const startTime = Date.now();

    const monthNumber = String(month).padStart(2, "0");
    const monthName = moment().month(month - 1).format("MMMM");
    const dayFolder = `${moment()
      .month(month - 1)
      .format("MMM")}${String(day).padStart(2, "0")}`;

    const dayPath = path.join(
      SOURCE_PATH,
      year,
      `${monthNumber}_${monthName}`,
      dayFolder
    );

    if (!fs.existsSync(dayPath)) {
      console.error(`Day folder not found: ${dayPath}`);
      return;
    }

    const folders = ["MAX", "MIN", "MEAN", "RH", "TCC", "TP", "WS"];

    for (const folder of folders) {
      const folderPath = path.join(dayPath, folder);

      if (!fs.existsSync(folderPath)) {
        console.log(`Folder not found: ${folder} in ${dayPath}`);
        continue;
      }

      const files = fs.readdirSync(folderPath);

      const resCFiles = files.filter((f) => f.endsWith("_res_C.tif"));
      const resFiles = files.filter((f) => f.endsWith("_res.tif"));

      const fileList =
        resCFiles.length > 0 ? resCFiles : resFiles;

      if (fileList.length === 0) {
        console.log("No _res_C.tif or _res.tif files found.");
        continue;
      }

      // ✅ SAFE sequential processing (FIXES ECONNRESET)
      for (const resFile of fileList) {
        try {
          const match = resFile.match(
            /(MAX|MIN|MEAN|RH|TCC|TP|WS)(\d+)_res(?:_C)?\.tif/
          );
          if (!match) continue;

          const folderNameMap = {
            MAX: "TMAX",
            MIN: "TMIN",
            MEAN: "TMEAN",
          };

          const folderNameRaw = match[1];
          const folderName =
            folderNameMap[folderNameRaw] || folderNameRaw;

          const num = parseInt(match[2], 10);

          const newDate = moment(
            `${year}-${monthNumber}-${day}`,
            "YYYY-MM-DD"
          )
            .add(num - 1, "days")
            .format("YYYYMMDD");

          const newFileName = `${folderName}_${newDate}`;

          const s3KeyBase = `${year}${monthNumber}${String(day).padStart(
            2,
            "0"
          )}/${folderName}`;

          const filePath = path.join(folderPath, resFile);

          const result = await maskTifOriginal(
            filePath,
            newFileName
          );
          if (!result) continue;

          const { origPath, maskedPath } = result;

          // ✅ upload original
          if (fs.existsSync(origPath)) {
            await uploadWithRetry({
              Bucket: BUCKET_NAME,
              Key: `${s3KeyBase}/${newFileName}_orig.tif`,
              Body: fs.createReadStream(origPath),
              ContentType: "application/octet-stream",
            });
          }

          // ✅ upload masked original
          if (fs.existsSync(maskedPath)) {
            await uploadWithRetry({
              Bucket: BUCKET_NAME,
              Key: `${s3KeyBase}/${newFileName}_masked_orig.tif`,
              Body: fs.createReadStream(maskedPath),
              ContentType: "application/octet-stream",
            });
          }
        } catch (err) {
          console.error(`❌ Failed processing ${resFile}`, err);
        }
      }
    }

    await deleteTempFiles();

    const duration = Date.now() - startTime;
    const formatted = moment.utc(duration).format("HH:mm:ss");

    const message = `Upload completed for ${year}-${month}-${day} in ${formatted}`;
    console.log(message);
    return message;
  };

  return await processFolder(year, month, day);
};