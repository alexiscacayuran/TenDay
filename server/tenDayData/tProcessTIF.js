import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import gdal from 'gdal-async';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';


const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
  maxAttempts: 3,
});

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

// Function to compress and clip a GeoTIFF file
const maskTif = async (targetFilePath, outputFileName) => {
  if (!fs.existsSync(targetFilePath)) {
    console.log(`File ${targetFilePath} not found`);
    return null;
  }

  const originalFileName = path.basename(targetFilePath);

  try {
    gdal.config.set("GDAL_PAM_ENABLED", "NO");

    const tif = await gdal.openAsync(targetFilePath);

    // Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR);
    }

    const cogPath = path.join(TEMP_DIR, `${outputFileName}.tif`);

    // Translate to COG
    const cog = await gdal.translateAsync(cogPath, tif, [
      "-co", "TILED=YES",
      "-co", "COPY_SRC_OVERVIEWS=YES",
      "-co", "COMPRESS=LZW",
    ]);

    log(chalk.bgRedBright(`${originalFileName}`) + '→ COG saved to:' + chalk.bgRedBright(`${cogPath}`));

    const maskedPath = path.join(TEMP_DIR, `${outputFileName}_masked.tif`);

    // Clip the COG
    await gdal.warpAsync(
      maskedPath,
      null,
      [cog],
      [
        "-cutline", geojsonPath,
        "-crop_to_cutline",
        "-co", "TILED=YES",
        "-co", "COPY_SRC_OVERVIEWS=YES",
        "-co", "COMPRESS=LZW",
      ]
    );

    log( 'COG clipped successfully: ' + chalk.yellow(`${maskedPath}`));

    // Close datasets
    cog.close();
    tif.close();

    return { cogPath, maskedPath };
  } catch (error) {
    console.error("Error processing file.", error);
  }

  return null;
};

// Main function to process and upload forecast TIF files
export const uploadForecastTIF = async (year, month, day) => {
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

    const folders = ['MAX', 'MIN', 'MEAN', 'RH', 'TCC', 'TP', 'WS'];
    for (const folder of folders) {
      const folderPath = path.join(dayPath, folder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        console.log(`Files in ${folderPath}:`, files);

        const resCFiles = files.filter(file => file.endsWith('_res_C.tif'));
        const resFiles = files.filter(file => file.endsWith('_res.tif'));

        const processFiles = async (fileList, suffix) => {
          for (const resFile of fileList) {
            const match = resFile.match(/(MAX|MIN|MEAN|RH|TCC|TP|WS)(\d+)_res(?:_C)?\.tif/);
            if (!match) continue;

            const folderName = match[1];
            const num = parseInt(match[2], 10);
            const newDate = moment(`${year}-${monthNumber}-${day}`, 'YYYY-MM-DD')
              .add(num - 1, 'days')
              .format('YYYYMMDD');

            const newFileName = `${folderName}_${newDate}`;
            const s3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folder}/${newFileName}.tif`;

            const filePath = path.join(folderPath, resFile);

            const result = await maskTif(filePath, newFileName);

            if (result) {
              const { cogPath, maskedPath } = result;

              if (fs.existsSync(cogPath)) {
                const cogFileContent = fs.readFileSync(cogPath);
                try {
                  await s3.send(new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key,
                    Body: cogFileContent,
                    ContentType: 'application/octet-stream',
                  }));
                  console.log(`${newFileName}.tif (COG) uploaded to S3`);
                } catch (err) {
                  console.error(`Error uploading ${newFileName}.tif (COG) to S3: ${err}`);
                }
              }

              if (fs.existsSync(maskedPath)) {
                const clipFileContent = fs.readFileSync(maskedPath);
                const clipS3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folder}/${newFileName}_masked.tif`;

                try {
                  await s3.send(new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: clipS3Key,
                    Body: clipFileContent,
                    ContentType: 'application/octet-stream',
                  }));
                  console.log(`${newFileName}_masked.tif uploaded to S3`);
                } catch (err) {
                  console.error(`Error uploading ${newFileName}_masked.tif to S3: ${err}`);
                }
              } else {
                console.log(`Clipped file ${newFileName}_masked.tif not found.`);
              }
            }
          }
        };

        if (resCFiles.length > 0) {
          await processFiles(resCFiles, '_res_C.tif');
        } else if (resFiles.length > 0) {
          await processFiles(resFiles, '_res.tif');
        } else {
          console.log('No _res_C.tif or _res.tif files found.');
        }
      } else {
        console.log(`Folder not found: ${folder} in ${dayPath}`);
      }
    }

    // Cleanup after processing all folders
    await deleteTempFiles();

    const endTime = Date.now();
    const duration = endTime - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    const durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const messagePlain = `Upload completed for ${year}-${month}-${day} in ${durationFormatted} (HH:MM:SS)`;
    const messageDecorated = `
👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍
${messagePlain}
👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍
`;
    console.log(messageDecorated);
    return messagePlain;
  };

  return await processFolder(year, month, day);
};
