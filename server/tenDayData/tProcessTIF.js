import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import gdal from 'gdal-async';

const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
  maxAttempts: 3,
});

const geojsonPath = './country_lowres_dissolved.geojson'; // GeoJSON for clipping

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

      await gdal.warpAsync(
        maskedPath,
        null,
        [tifCompressed],
        ['-cutline', geojsonPath, '-crop_to_cutline', '-co', 'COMPRESS=LZW']
      );

      console.log(`TIF clipped successfully: ${maskedPath}`);
      tifCompressed.close();
      return maskedPath;
    } catch (error) {
      console.error('Error clipping TIF.', error);
    }

    tif.close();
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
      console.timeEnd('Upload Time'); // End timer if early exit
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

            const params = new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: s3Key,
              Body: fileContent,
              ContentType: 'application/octet-stream',
            });

            try {
              await s3.send(params);
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

              const clipParams = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: clipS3Key,
                Body: clipFileContent,
                ContentType: 'application/octet-stream',
              });

              try {
                await s3.send(clipParams);
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

              const params = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: fileContent,
                ContentType: 'application/octet-stream',
              });

              try {
                await s3.send(params);
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

              const clipParams = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: clipS3Key,
                Body: clipFileContent,
                ContentType: 'application/octet-stream',
              });

              try {
                await s3.send(clipParams);
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

