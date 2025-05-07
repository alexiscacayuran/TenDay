import fs from 'fs-extra';
import path from 'path';
import s3 from '../aws.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const SOURCE_DIR = '\\\\172.17.17.37\\iaas-climgrid\\Climpact_Output\\2_tiff';
const BUCKET_NAME = 'ceram';

export const uploadTIF = async () => {
  let uploadedCount = 0;

  const folders = ['Tmin', 'Tmax', 'RR']; // local folders

  for (const folder of folders) {
    const folderPath = path.join(SOURCE_DIR, folder);

    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️ Skipping missing folder: ${folderPath}`);
      continue;
    }

    const awsCategory = folder.toUpperCase(); // TMIN, TMAX, RR

    const files = fs.readdirSync(folderPath).filter(file => file.toLowerCase().endsWith('.tif'));

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      // Supports files like:
      // masked_tnm_90thP_ANN_ssp585_2071-2100.tif
      // masked_rx1day_mean_ANN_ssp119_2071-2100.tif
      const match = file.match(/^masked_(\w+?)_([a-zA-Z0-9]+)_ANN_ssp(\d+)_\d{4}-\d{4}\.tif$/);

      if (!match) {
        console.warn(`⚠️ Skipping unrecognized file format: ${file}`);
        continue;
      }

      const [_, index, rawPercentile, scenario] = match;

      // Normalize percentile (e.g., 90thP → 90)
      const percentile = rawPercentile.replace(/thP$/i, '');

      const s3Key = `${awsCategory}/${index}/${percentile}/${scenario}/${file}`;
      const fileContent = fs.readFileSync(filePath);

      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'image/tiff',
          })
        );
        console.log(`✅ Uploaded to s3://${BUCKET_NAME}/${s3Key}`);
        uploadedCount++;
      } catch (err) {
        console.error(`❌ Failed to upload ${file}:`, err);
      }
    }
  }

  console.log(`\n✅ Total uploaded files: ${uploadedCount}`);
  return `Uploaded ${uploadedCount} files.`;
};
