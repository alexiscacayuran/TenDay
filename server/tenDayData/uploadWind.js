import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import gdal from "gdal-async";
import fs from "fs/promises";
import path from "path";

const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
  maxAttempts: 3,
});

const BUCKET_NAME = "tendayforecast";
const TEMP_DIR = "./temp"; // Custom temp directory

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

// Function to generate file path
const getFilePath = (year, month, day, type) => {
  const formattedMonth = monthMap[month];
  const formattedDay = `${formattedMonth.split("_")[1].slice(0, 3)}${day}`;

  return `\\\\10.10.3.118\\climps\\10_Day\\Data\\${year}\\${formattedMonth}\\${formattedDay}\\${type}`;
};

// Ensure temp directory exists
const ensureTempDir = async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error(`Error creating temp directory: ${error}`);
  }
};

// Upload all .asc files in parallel
const uploadAllAscFiles = async (startDate) => {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const ascFiles = files.filter((file) => file.endsWith(".asc"));

    const uploadPromises = ascFiles.map(async (file) => {
      const filePath = path.join(TEMP_DIR, file);
      const key = `${startDate}/WIND/${file}`; // Format: tendayforecast/{startDate}/WIND/{file}

      try {
        const fileContent = await fs.readFile(filePath);
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: fileContent,
        });

        await s3.send(command);
        console.log(`Uploaded: ${key}`);
      } catch (uploadError) {
        console.error(`Failed to upload ${file}:`, uploadError);
      }
    });

    await Promise.all(uploadPromises); // Upload all files in parallel
  } catch (error) {
    console.error(`Error uploading ASC files: ${error}`);
  }
};

// Delete all files inside temp folder after upload
const deleteAllTempFiles = async () => {
  try {
    const files = await fs.readdir(TEMP_DIR);
    await Promise.all(
      files.map((file) => fs.unlink(path.join(TEMP_DIR, file)))
    );
    console.log("Deleted all temp files.");
  } catch (error) {
    console.error(`Error deleting temp files: ${error}`);
  }
};

// Convert .tif to .asc
const translateTifToAsc = async (targetFilePath, tempFileName) => {
  try {
    if (!(await fs.stat(targetFilePath).catch(() => false))) {
      console.warn(`File not found: ${targetFilePath}`);
      return;
    }

    console.log(`Processing: ${targetFilePath}`);
    const dataset = await gdal.openAsync(targetFilePath);
    const tempFilePath = path.join(TEMP_DIR, tempFileName);

    await gdal.translate(tempFilePath, dataset, ["-of", "AAIGrid"]);
    dataset.close();
    console.log(`Translated file saved to: ${tempFilePath}`);
  } catch (error) {
    console.error(`Error processing ${targetFilePath}:`, error);
  }
};

// Main function to process wind files
export const processWindFiles = async (year, month, day) => {
  await ensureTempDir(); // Ensure temp folder exists

  const startDate = `${year}${month}${day}`;
  let currentDate = new Date(`${year}-${month}-${day}`);

  // Translate all TIF files first
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

    await translateTifToAsc(uFilePath, `U_${dateStr}.asc`);
    await translateTifToAsc(vFilePath, `V_${dateStr}.asc`);

    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Upload all ASC files in parallel after processing
  await uploadAllAscFiles(startDate);

  // Delete all files in temp directory
  await deleteAllTempFiles();
};
