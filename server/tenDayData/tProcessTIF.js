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

export const processFiles = async (year, month, day) => {
  const SOURCE_PATH = '\\\\10.10.3.118\\climps\\10_Day\\Data';
  const BUCKET_NAME = 'tendayforecast';
  let totalFiles = 0;
  let uploadedFiles = 0;

  const processFolder = async (year, month, day) => {
    const monthNumber = String(month).padStart(2, '0');
    const monthName = moment().month(month - 1).format('MMMM');
    const dayFolder = `${moment().month(month - 1).format('MMM')}${String(day).padStart(2, '0')}`;
    const dayPath = path.join(SOURCE_PATH, year, `${monthNumber}_${monthName}`, dayFolder);

    if (!fs.existsSync(dayPath)) {
      console.error(`❌ Day folder not found: ${dayPath}`);
      return;
    }

    const folders = ['MAX', 'MIN', 'MEAN', 'RH', 'TCC', 'TP', 'WS'];
    let uploadTasks = [];

    for (const folder of folders) {
      const folderPath = path.join(dayPath, folder);
      if (!fs.existsSync(folderPath)) {
        console.log(`📂 Folder not found: ${folder} in ${dayPath}`);
        continue;
      }

      const files = fs.readdirSync(folderPath).filter(file =>
        file.endsWith('_res.tif') || file.endsWith('_res_C.tif')
      );

      totalFiles += files.length;

      for (const file of files) {
        const match = file.match(/(MAX|MIN|MEAN|RH|TCC|TP|WS)(\d+)_res(_C)?\.tif/);
        if (!match) continue;

        const folderName = match[1];
        const num = parseInt(match[2], 10);

        // Calculate the new date
        const newDate = moment(`${year}-${monthNumber}-${day}`, 'YYYY-MM-DD')
          .add(num - 1, 'days')
          .format('YYYYMMDD');

        const newFileName = `${folderName}_${newDate}.tif`;
        const s3Key = `${year}${monthNumber}${String(day).padStart(2, '0')}/${folder}/${newFileName}`;
        const filePath = path.join(folderPath, file);

        uploadTasks.push(uploadFile(filePath, s3Key));
      }
    }

    // Wait for all uploads to complete
    await Promise.all(uploadTasks);

    // Final API response
    return `${uploadedFiles}/${totalFiles} files uploaded`;
  };

  const uploadFile = async (filePath, s3Key, retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const fileContent = fs.readFileSync(filePath);
        const params = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: fileContent,
          ContentType: 'application/octet-stream',
        });

        await s3.send(params);
        uploadedFiles++;
        console.log(`✅ Uploaded: ${s3Key} (${uploadedFiles}/${totalFiles})`);
        return true;
      } catch (err) {
        console.error(`❌ Error uploading ${s3Key}: ${err.message} (Attempt ${i + 1}/${retries})`);
        if (i < retries - 1) await new Promise(res => setTimeout(res, delay * (i + 1)));
      }
    }
    return false;
  };

  return await processFolder(year, month, day);
};
