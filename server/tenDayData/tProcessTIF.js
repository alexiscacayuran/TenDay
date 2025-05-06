import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import gdal from 'gdal-async';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
<<<<<<< HEAD
import chalk from 'chalk';

=======
>>>>>>> main

const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
  maxAttempts: 3,
});

<<<<<<< HEAD
const TEMP_DIR = './tif'; // Temporary directory for TIF files
=======
const TEMP_DIR = './tif'; // temp directory for TIF files

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Construct a path that's relative to this file's location
const geojsonPath = join(__dirname, 'country_lowres_dissolved.geojson');

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
>>>>>>> main

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

<<<<<<< HEAD
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
=======
    const tifCompressedPath = `./tif/${tifFileName}.tif`;
    const tifCompressed = await gdal.warpAsync(
      tifCompressedPath,
      null,
      [tif],
      ['-co', 'COMPRESS=LZW']
    );

    console.log(`Compressed TIF saved to: ${tifCompressedPath}`);

    try {
      const maskedPath = `./tif/${tifFileName}_masked.tif`;

      const tifMasked = await gdal.warpAsync(
        maskedPath,
        null,
        [tifCompressed],
        ['-cutline', geojsonPath, '-crop_to_cutline', '-co', 'COMPRESS=LZW']
      );

      console.log(`TIF clipped successfully: ${maskedPath}`);

      // VERY IMPORTANT: close the masked TIF after processing
      tifMasked.close();
      tifCompressed.close();
      tif.close();

      return maskedPath;
    } catch (error) {
      console.error('Error clipping TIF.', error);
      tifCompressed.close();
      tif.close();
    }
>>>>>>> main
  } catch (error) {
    console.error("Error processing file.", error);
  }

  return null;
};

<<<<<<< HEAD
// Main function to process and upload forecast TIF files
=======

>>>>>>> main
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

<<<<<<< HEAD
            const filePath = path.join(folderPath, resFile);

            const result = await maskTif(filePath, newFileName);
=======
            try {
              await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: fileContent,
                ContentType: 'application/octet-stream',
              }));
              console.log(`${resCFile} uploaded as ${newFileName} to S3`);
            } catch (err) {
              console.error(`Error uploading ${resCFile} to S3: ${err}`);
            }
>>>>>>> main

            if (result) {
              const { cogPath, maskedPath } = result;

<<<<<<< HEAD
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
                const clipS3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folderName}/${newFileName}_masked.tif`;

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
=======
            if (clipFilePath && fs.existsSync(clipFilePath)) {
              const clipFileContent = fs.readFileSync(clipFilePath);
              const clipS3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folder}/${clipFileName}`;

              try {
                await s3.send(new PutObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: clipS3Key,
                  Body: clipFileContent,
                  ContentType: 'application/octet-stream',
                }));
                console.log(`${clipFileName} uploaded to S3`);
              } catch (err) {
                console.error(`Error uploading ${clipFileName} to S3: ${err}`);
>>>>>>> main
              }
            }
          }
        };

        if (resCFiles.length > 0) {
          await processFiles(resCFiles, '_res_C.tif');
        } else if (resFiles.length > 0) {
          await processFiles(resFiles, '_res.tif');
        } else {
<<<<<<< HEAD
          console.log('No _res_C.tif or _res.tif files found.');
=======
          console.log('No _res_C.tif files found.');

          const resFiles = files.filter(file => file.endsWith('_res.tif'));
          console.log(`Found _res.tif files:`, resFiles);

          if (resFiles.length > 0) {
            for (const resFile of resFiles) {
              const match = resFile.match(/(MAX|MIN|MEAN|RH|TCC|TP|WS)(\d+)_res\.tif/);
              if (!match) continue;

              const folderName = match[1];
              const num = parseInt(match[2], 10);
              const newDate = moment(`${year}-${monthNumber}-${day}`, 'YYYY-MM-DD')
                .add(num - 1, 'days')
                .format('YYYYMMDD');

              const newFileName = `${folderName}_${newDate}.tif`;
              const s3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folder}/${newFileName}`;
              const fileContent = fs.readFileSync(path.join(folderPath, resFile));

              try {
                await s3.send(new PutObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: s3Key,
                  Body: fileContent,
                  ContentType: 'application/octet-stream',
                }));
                console.log(`${resFile} uploaded as ${newFileName} to S3`);
              } catch (err) {
                console.error(`Error uploading ${resFile} to S3: ${err}`);
              }

              // Generate and upload clipped version
              const clipFileName = `${folderName}_${newDate}_masked.tif`;
              const clipFilePath = await maskTif(path.join(folderPath, resFile), `${folderName}_${newDate}`);

              if (clipFilePath && fs.existsSync(clipFilePath)) {
                const clipFileContent = fs.readFileSync(clipFilePath);
                const clipS3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folder}/${clipFileName}`;

                try {
                  await s3.send(new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: clipS3Key,
                    Body: clipFileContent,
                    ContentType: 'application/octet-stream',
                  }));
                  console.log(`${clipFileName} uploaded to S3`);
                } catch (err) {
                  console.error(`Error uploading ${clipFileName} to S3: ${err}`);
                }
              } else {
                console.log(`Clipped file ${clipFileName} not found.`);
              }
            }
          }
>>>>>>> main
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
