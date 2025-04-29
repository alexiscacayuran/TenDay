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
<<<<<<< HEAD
const TEMP_DIR = "C:\\Users\\gabri\\PAGASA\\server\\temp";
const GEOJSON_PATH = "C:\\Users\\gabri\\10_DAY_FORECAST\\TanawPH\\server\\tenDayData\\country_lowres_dissolved.geojson"; 
=======
const TEMP_DIR = './tif'; // temp directory for TIF files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Construct a path that's relative to this file's location
const GEOJSON_PATH = join(__dirname, 'country_lowres_dissolved.geojson');

>>>>>>> backend

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
