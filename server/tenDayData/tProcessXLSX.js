import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
  maxAttempts: 3,
});

export const uploadForecastXLSX = async (year, month, day) => {
  const BUCKET_NAME = 'tendayforecast';

  const monthIndex = parseInt(month, 10) - 1;
  const dayStr = String(day).padStart(2, '0');
  const monthStr = String(month).padStart(2, '0');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid month: ${month}`);
  }

  const fullMonth = monthNames[monthIndex];     // April
  const shortMonth = fullMonth.substring(0, 3); // Apr

  const SOURCE_PATH = `\\\\10.10.3.118\\climps\\10_Day\\Data\\${year}\\${monthStr}_${fullMonth}\\${shortMonth}${dayStr}\\10day_forecast`;

  const startTime = Date.now();
  const baseDate = moment(`${year}-${monthStr}-${dayStr}`, 'YYYY-MM-DD');

  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error(`10day_forecast folder not found at ${SOURCE_PATH}`);
  }

  const files = fs.readdirSync(SOURCE_PATH).filter(file => /^day\d+\.xlsx$/i.test(file));
  if (files.length === 0) {
    throw new Error('No dayN.xlsx files found in the 10day_forecast folder.');
  }

  for (const file of files) {
    const match = file.match(/day(\d+)\.xlsx/i);
    if (!match) continue;

    const dayOffset = parseInt(match[1], 10) - 1;
    const newDate = baseDate.clone().add(dayOffset, 'days').format('YYYYMMDD');
    const newFileName = `FORECAST_${newDate}.xlsx`;
    const s3Key = `${year}${monthStr}${dayStr}/XLSX/${newFileName}`;
    const fileContent = fs.readFileSync(path.join(SOURCE_PATH, file));

    const params = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    try {
      await s3.send(params);
      console.log(`${file} uploaded as ${newFileName} to S3`);
    } catch (err) {
      console.error(`Error uploading ${file} to S3:`, err);
    }
  }

  const duration = moment.duration(moment().diff(startTime));
  const durationFormatted = moment.utc(duration.asMilliseconds()).format('HH:mm:ss');

  const messagePlain = `Upload completed for ${year}-${monthStr}-${dayStr} in ${durationFormatted} (HH:MM:SS)`;
  console.log(messagePlain);
  return messagePlain;
};
