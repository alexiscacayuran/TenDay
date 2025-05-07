import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import s3 from '../aws.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import gdal from 'gdal-async';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const TEMP_DIR = './tif'; // Temporary directory for TIF files

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct a path relative to this file's location
const geojsonPath = join(__dirname, 'country_lowres_dissolved.geojson');

const log = console.log;

// Function to delete temporary files
const deleteTempFiles = async () => {
  try {
    if (fs.existsSync(TEMP_DIR)) {
      const files = await fs.readdir(TEMP_DIR);
      await Promise.all(files.map((file) => fs.unlink(path.join(TEMP_DIR, file))));
      console.log("Deleted all temp files.");
    }
  } catch (error) {
    console.error("Error deleting temp files:", error);
  }
};

// Function to merge U10 and V10 GeoTIFF files
const mergeTif = async (src1, src2, outputFileName) => {
  const tempPath = `./temp.tif`;
  const ds1 = gdal.open(src1);
  const ds2 = gdal.open(src2);

  const band1 = ds1.bands.get(1);
  const band2 = ds2.bands.get(1);

  const width = ds1.rasterSize.x;
  const height = ds1.rasterSize.y;

  if (width !== ds2.rasterSize.x || height !== ds2.rasterSize.y) {
    throw new Error("Source rasters must have the same dimensions.");
  }

  if (band1.dataType !== band2.dataType) {
    throw new Error("Source rasters must have the same data type.");
  }

  const driver = gdal.drivers.get("GTiff");
  const dst = driver.create(tempPath, width, height, 2, band1.dataType);

  const data1 = band1.pixels.read(0, 0, width, height);
  const data2 = band2.pixels.read(0, 0, width, height);

  dst.bands.get(1).pixels.write(0, 0, width, height, data1);
  dst.bands.get(2).pixels.write(0, 0, width, height, data2);

  dst.geoTransform = ds1.geoTransform;
  dst.srs = ds1.srs;
  dst.flush();
  dst.close();

  const tif = await gdal.openAsync(tempPath);

  const dest = `./tif/${outputFileName}.tif`;
  // Convert to Cloud Optimized GeoTIFF
  const cog = await gdal.translateAsync(dest, tif, [
    "-co",
    "COMPRESS=DEFLATE",
    "-co",
    "TILED=YES",
    "-co",
    "INTERLEAVE=BAND",
    "-co",
    "COMPRESS=DEFLATE",
  ]);

  try {
    const destMasked = `./tif/${outputFileName}_masked.tif`;

    // Perform the clipping using the reopened dataset
    const maskedCog = await gdal.warpAsync(
      destMasked,
      null,
      [cog], // Corrected: Pass the reopened dataset
      [
        "-cutline",
        geojsonPath, // Use the GeoJSON as the cutline
        "-crop_to_cutline", // Crop to the polygon boundary
        "-co",
        "TILED=YES",
        "-co",
        "COPY_SRC_OVERVIEWS=YES",
        "-co",
        "COMPRESS=DEFLATE", // Optional: Set compression
      ]
    );

    console.log("COG clipped successfully:", destMasked);

    // Close dataset after processing
    cog.close();
    maskedCog.close();
  } catch (error) {
    console.error("Error clipping ASC.", error);
  }

  tif.close();

  try {
    await fs.promises.unlink(tempPath);
    console.log(`Temporary file ${tempPath} removed`);
  } catch (err) {
    console.error(`Failed to delete ${tempPath}:`, err.message);
  }

  console.log(`COG file saved to ${dest}`);
};

export const uploadForecastWind = async (year, month, day) => {
  const SOURCE_PATH = '\\\\10.10.3.118\\climps\\10_Day\\Data';
  const BUCKET_NAME = 'tendayforecast';

  const processFolder = async (year, month, day) => {
    const startTime = Date.now();
    const monthNumber = String(month).padStart(2, '0');
    const monthName = moment().month(month - 1).format('MMMM');
    const dayFolder = `${moment().month(month - 1).format('MMM')}${String(day).padStart(2, '0')}`;
    const dayPath = path.join(SOURCE_PATH, year, `${monthNumber}_${monthName}`, dayFolder);

    if (!fs.existsSync(dayPath)) {
      console.error(`Day folder not found: ${dayPath}`);
      return;
    }

    const folders = ['U10', 'V10'];
    const u10Files = [];
    const v10Files = [];

    for (const folder of folders) {
      const folderPath = path.join(dayPath, folder);
      if (!fs.existsSync(folderPath)) {
        console.log(`Folder not found: ${folder} in ${dayPath}`);
        continue;
      }

      const files = fs.readdirSync(folderPath);
      const resFiles = files.filter(file => file.endsWith('_res.tif'));

      for (const resFile of resFiles) {
        const match = resFile.match(/(U|V)(\d+)_res\.tif/);
        if (!match) continue;

        const type = match[1]; // U or V
        const num = parseInt(match[2], 10);
        const filePath = path.join(folderPath, resFile);

        if (type === 'U') {
          u10Files[num] = filePath;
        } else {
          v10Files[num] = filePath;
        }
      }
    }

    for (let i = 1; i < u10Files.length; i++) {
      const uFile = u10Files[i];
      const vFile = v10Files[i];

      if (!uFile || !vFile) continue;

      const newDate = moment(`${year}-${monthNumber}-${day}`, 'YYYY-MM-DD')
        .add(i - 1, 'days')
        .format('YYYYMMDD');

      const mergedFileName = `UV_${newDate}`;
      const s3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/UV/${mergedFileName}.tif`;
      const maskedS3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/UV/${mergedFileName}_masked.tif`;

      await mergeTif(uFile, vFile, mergedFileName);

      const mergedPath = `./tif/${mergedFileName}.tif`;
      const maskedPath = `./tif/${mergedFileName}_masked.tif`;

      if (fs.existsSync(mergedPath)) {
        const fileContent = fs.readFileSync(mergedPath);
        try {
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'application/octet-stream',
          }));
          log(chalk.bgGreenBright(`${mergedFileName}.tif uploaded to S3`));

        } catch (err) {
          console.error(`Error uploading ${mergedFileName}.tif to S3: ${err}`);
        }
      }

      if (fs.existsSync(maskedPath)) {
        const fileContent = fs.readFileSync(maskedPath);
        try {
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: maskedS3Key,
            Body: fileContent,
            ContentType: 'application/octet-stream',
          }));
          console.log(`${mergedFileName}_masked.tif uploaded to S3`);
        } catch (err) {
          console.error(`Error uploading ${mergedFileName}_masked.tif to S3: ${err}`);
        }
      }
    }

    await deleteTempFiles();

    const endTime = Date.now();
    const duration = endTime - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    const durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const messagePlain = `Wind upload completed for ${year}-${month}-${day} in ${durationFormatted} (HH:MM:SS)`;
    const messageDecorated = `
🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️
${messagePlain}
🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️🌬️

`;
    console.log(messageDecorated);
    return messagePlain;
  };

  return await processFolder(year, month, day);
};



{/** 
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import gdal from "gdal-async";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
  maxAttempts: 3,
});

const BUCKET_NAME = "tendayforecast";
const TEMP_DIR = './tif'; // temp directory for TIF files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Construct a path that's relative to this file's location
const GEOJSON_PATH = join(__dirname, 'country_lowres_dissolved.geojson');


const monthMap = {
  "01": "01_January",
  "02": "02_February",
  "03": "03_March",
  "04": "04_April",
  "05": "05_May",
  "06": "06_June",
  "07": "07_July",
  "08": "08_August",
  "09": "09_September",
  10: "10_October",
  11: "11_November",
  12: "12_December",
};

const getFilePath = (year, month, day, type) => {
  const formattedMonth = monthMap[month];
  const formattedDay = `${formattedMonth.split("_")[1].slice(0, 3)}${day}`;
  return `\\\\10.10.3.118\\climps\\10_Day\\Data\\${year}\\${formattedMonth}\\${formattedDay}\\${type}`;
};

const ensureTempDir = async () => {
  await fs.mkdir(TEMP_DIR, { recursive: true }).catch(() => {});
};

const uploadFileToS3 = async (filePath, key) => {
  try {
    const fileContent = await fs.readFile(filePath);
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
    });
    await s3.send(command);
    console.log(`Uploaded: ${key}`);
  } catch (error) {
    console.error(`Failed to upload ${key}:`, error);
  }
};

const deleteTempFiles = async () => {
  try {
    const files = await fs.readdir(TEMP_DIR);
    await Promise.all(
      files.map((file) => fs.unlink(path.join(TEMP_DIR, file)))
    );
    console.log("Deleted all temp files.");
  } catch (error) {
    console.error("Error deleting temp files:", error);
  }
};

const translateTifToAsc = async (tifPath, ascFileName) => {
  try {
    if (!(await fs.stat(tifPath).catch(() => false))) return;
    const dataset = await gdal.openAsync(tifPath);
    const ascPath = path.join(TEMP_DIR, `${ascFileName}.asc`);
    await gdal.translate(ascPath, dataset, ["-of", "AAIGrid"]);
    dataset.close();
    console.log(`Translated: ${ascPath}`);
    return ascPath;
  } catch (error) {
    console.error(`Error translating ${tifPath}:`, error);
  }
};

const clipTifToAsc = async (tifPath, maskedFileName) => {
  try {
    if (!(await fs.stat(tifPath).catch(() => false))) return;
    const dataset = await gdal.openAsync(tifPath);
    const maskedAscPath = path.join(TEMP_DIR, `${maskedFileName}_masked.asc`);
    await gdal.warpAsync(
      maskedAscPath,
      null,
      [dataset],
      ["-cutline", GEOJSON_PATH, "-crop_to_cutline", "-of", "AAIGrid"]
    );
    dataset.close();
    console.log(`Clipped and converted to ASC: ${maskedAscPath}`);
    return maskedAscPath;
  } catch (error) {
    console.error(`Error clipping ${tifPath}:`, error);
  }
};

export const processWindFiles = async (year, month, day) => {
  await ensureTempDir();
  const startTime = Date.now(); // ⏱️ Start timer
  const startDate = `${year}${month}${day}`;
  let currentDate = new Date(`${year}-${month}-${day}`);

  for (let i = 1; i <= 10; i++) {
    const dateStr = currentDate.toISOString().split("T")[0].replace(/-/g, "");
    const uFilePath = path.join(
      getFilePath(year, month, day, "U10"),
      `U${i}_res.tif`
    );
    const vFilePath = path.join(
      getFilePath(year, month, day, "V10"),
      `V${i}_res.tif`
    );

    const uAscPath = await translateTifToAsc(uFilePath, `U_${dateStr}`);
    const vAscPath = await translateTifToAsc(vFilePath, `V_${dateStr}`);
    const uMaskedAscPath = await clipTifToAsc(uFilePath, `U_${dateStr}`);
    const vMaskedAscPath = await clipTifToAsc(vFilePath, `V_${dateStr}`);

    if (uAscPath)
      await uploadFileToS3(
        uAscPath,
        `${startDate}/WIND/${path.basename(uAscPath)}`
      );
    if (vAscPath)
      await uploadFileToS3(
        vAscPath,
        `${startDate}/WIND/${path.basename(vAscPath)}`
      );
    if (uMaskedAscPath)
      await uploadFileToS3(
        uMaskedAscPath,
        `${startDate}/WIND/${path.basename(uMaskedAscPath)}`
      );
    if (vMaskedAscPath)
      await uploadFileToS3(
        vMaskedAscPath,
        `${startDate}/WIND/${path.basename(vMaskedAscPath)}`
      );

    await new Promise((resolve) => setTimeout(resolve, 100));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  await deleteTempFiles();

  // ⏲️ End timer and log duration
  const endTime = Date.now();
  const duration = endTime - startTime;
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((duration % (1000 * 60)) / 1000);
  const durationFormatted = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const messagePlain = `Upload completed for ${year}-${month}-${day} in ${durationFormatted} (HH:MM:SS)`;
  const messageDecorated = `
💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙
${messagePlain}
💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙💙
`;

  console.log(messageDecorated);
};
*/}
