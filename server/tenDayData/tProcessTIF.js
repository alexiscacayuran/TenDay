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
      "-co", "COMPRESS=DEFLATE",
    ]);

    await cog.buildOverviewsAsync("AVERAGE", [2, 4, 8, 16, 32]);

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
        "-co", "COMPRESS=DEFLATE",
      ]
    );

    log( 'COG clipped successfully: ' + chalk.yellow(`${maskedPath}`));

    // Build overviews on the clipped (masked) file
    const maskedDataset = await gdal.openAsync(maskedPath, 'r+');
    await maskedDataset.buildOverviewsAsync("AVERAGE", [2, 4, 8, 16, 32]);
    maskedDataset.close();
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
    try {
    const startTime = Date.now();
    const monthNumber = String(month).padStart(2, '0');
    const monthName = moment().month(month - 1).format('MMMM');
    const dayFolder = `${moment().month(month - 1).format('MMM')}${String(day).padStart(2, '0')}`;
    const dayPath = path.join(SOURCE_PATH, year, `${monthNumber}_${monthName}`, dayFolder);

    if (!fs.existsSync(dayPath)) {
      const msg = `Day folder not found: ${dayPath}`;
      console.error(msg);
      return { success: false, message: msg };
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
          await Promise.all(fileList.map(async (resFile) => {
            const match = resFile.match(/(MAX|MIN|MEAN|RH|TCC|TP|WS)(\d+)_res(?:_C)?\.tif/);
            if (!match) return;
        
            const folderNameMap = {
              MAX: 'TMAX',
              MIN: 'TMIN',
              MEAN: 'TMEAN',
            };
            const folderNameRaw = match[1];
            const folderName = folderNameMap[folderNameRaw] || folderNameRaw;
            
            const num = parseInt(match[2], 10);
            const newDate = moment(`${year}-${monthNumber}-${day}`, 'YYYY-MM-DD')
              .add(num - 1, 'days')
              .format('YYYYMMDD');
        
            const newFileName = `${folderName}_${newDate}`;
            const s3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folderName}/${newFileName}.tif`;
        
            const filePath = path.join(folderPath, resFile);
            const result = await maskTif(filePath, newFileName);
            if (!result) return;
        
            const { cogPath, maskedPath } = result;
            const uploadTasks = [];
        
            // Upload COG
            if (fs.existsSync(cogPath)) {
              const cogFileStream = fs.createReadStream(cogPath);
              const uploadCOG = s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: cogFileStream,
                ContentType: 'application/octet-stream',
              }))
              .then(() => console.log(`${newFileName}.tif (COG) uploaded to S3`))
              .catch((err) => console.error(`Error uploading ${newFileName}.tif (COG) to S3: ${err}`));
              
              uploadTasks.push(uploadCOG);
            }
        
            // Upload Masked
            if (fs.existsSync(maskedPath)) {
              const clipFileStream = fs.createReadStream(maskedPath);
              const clipS3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folderName}/${newFileName}_masked.tif`;
        
              const uploadMasked = s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: clipS3Key,
                Body: clipFileStream,
                ContentType: 'application/octet-stream',
              }))
              .then(() => console.log(`${newFileName}_masked.tif uploaded to S3`))
              .catch((err) => console.error(`Error uploading ${newFileName}_masked.tif to S3: ${err}`));
              
              uploadTasks.push(uploadMasked);
            } else {
              console.log(`Clipped file ${newFileName}_masked.tif not found.`);
            }
        
            // Wait for all uploads to finish for this file
            await Promise.all(uploadTasks);
          }));
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
    return { success: true, message: messagePlain };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, message: `Unexpected error: ${error.message}` };
  }
};

  return await processFolder(year, month, day);
};
