import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import gdal from 'gdal-async';
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

const maskTif = async (targetFilePath, tifFileName) => {
  if (!fs.existsSync(targetFilePath)) {
    console.log(`File ${targetFilePath} not found`);
    return null;
  }

  try {
    gdal.config.set('GDAL_PAM_ENABLED', 'NO');

    const tif = await gdal.openAsync(targetFilePath);
    if (!fs.existsSync('./tif')) fs.mkdirSync('./tif');

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
  } catch (error) {
    console.error('Error processing file.', error);
  }
  return null;
};


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
        console.log(`Found _res_C.tif files:`, resCFiles);

        if (resCFiles.length > 0) {
          for (const resCFile of resCFiles) {
            const match = resCFile.match(/(MAX|MIN|MEAN|RH|TCC|TP|WS)(\d+)_res_C\.tif/);
            if (!match) continue;

            const folderName = match[1];
            const num = parseInt(match[2], 10);
            const newDate = moment(`${year}-${monthNumber}-${day}`, 'YYYY-MM-DD')
              .add(num - 1, 'days')
              .format('YYYYMMDD');

            const newFileName = `${folderName}_${newDate}.tif`;
            const s3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folder}/${newFileName}`;
            const fileContent = fs.readFileSync(path.join(folderPath, resCFile));

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

            // Generate and upload clipped version
            const clipFileName = `${folderName}_${newDate}_masked.tif`;
            const clipFilePath = await maskTif(path.join(folderPath, resCFile), `${folderName}_${newDate}`);

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
        } else {
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
