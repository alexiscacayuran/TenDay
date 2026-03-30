import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import s3 from '../aws.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export const uploadForecastXLSX = async (year, month, day) => {
  //const SOURCE_PATH = 'C:\\Users\\gabri\\TenDay\\Data';
  //const SOURCE_PATH = '\\\\10.10.3.118\\climps\\10_Day\\Data';
  const SOURCE_PATH = "/mnt/climps/10_Day/Data";
  const BUCKET_NAME = 'tendayforecast';

  const baseDate = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
  const formattedDate = baseDate.format('YYYY-MM-DD');
  const s3DateFolder = baseDate.format('YYYYMMDD'); 
  const monthNumber = String(month).padStart(2, '0');
  const monthName = moment().month(month - 1).format('MMMM');
  const dayFolder = `${moment().month(month - 1).format('MMM')}${String(day).padStart(2, '0')}`;

  const folderPath = path.join(
    SOURCE_PATH,
    year,
    `${monthNumber}_${monthName}`,
    dayFolder,
    '10day_forecast'
  );

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Folder not found (${formattedDate})`);
    return `Folder not found (${formattedDate})`;
  }

  const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.xlsx'));

  if (files.length === 0) {
    console.log(`ℹ️ No XLSX files found in (${formattedDate})`);
    return 'No XLSX files found to upload';
  }

  let uploadedCount = 0;

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileContent = fs.readFileSync(filePath);

    let newFileName = '';
    let logLabel = '';

    const dayMatch = file.match(/^day(\d+)\.xlsx$/i);
    if (dayMatch) {
      const dayOffset = parseInt(dayMatch[1], 10) - 1;
      const fileDate = baseDate.clone().add(dayOffset, 'days');
      newFileName = `TenDay_${fileDate.format('YYYYMMDD')}.xlsx`;
      logLabel = `Uploaded ${file} as ${newFileName}`;
    } 
    else if (/^10 Day Weather Forecast for Municipalities.*\.xlsx$/i.test(file)) {
      newFileName = 'TenDay.xlsx';
      logLabel = `Uploaded ${file} as ${newFileName}`;
    } 
    else {
      console.log(`⚠️ Skipped unrecognized file: ${file}`);
      continue;
    }

    const s3Key = `${s3DateFolder}/XLSX/${newFileName}`;

    try {
      const uploadParams = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: fileContent,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await s3.send(uploadParams);
      console.log(`✅ ${logLabel}`);
      uploadedCount++;
    } catch (error) {
      console.error(`❌ Failed to upload ${file}`);
    }
  }

  const summary = `Uploaded ${uploadedCount} XLSX file(s) for ${formattedDate}`;
  console.log(`
🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️
${summary}
🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️
`);

  return summary;
};
