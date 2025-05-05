import fs from 'fs-extra';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
  maxAttempts: 3,
});

export const uploadCeramCSV = async () => {
  const SOURCE_PATH = '\\\\172.17.17.35\\iaas\\CERAM\\CMIP6\\CSV';
  const BUCKET_NAME = 'ceram';
  const S3_FOLDER = 'CSV';

  if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`❌ Source folder not found: ${SOURCE_PATH}`);
    return `Source folder not found: ${SOURCE_PATH}`;
  }

  const files = fs.readdirSync(SOURCE_PATH).filter(file => file.toLowerCase().endsWith('.csv'));

  if (files.length === 0) {
    console.log(`ℹ️ No CSV files found in: ${SOURCE_PATH}`);
    return 'No CSV files found to upload';
  }

  let uploadedCount = 0;

  for (const file of files) {
    const filePath = path.join(SOURCE_PATH, file);
    const fileContent = fs.readFileSync(filePath);

    const s3Key = `${S3_FOLDER}/${file}`;

    try {
      const uploadParams = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: fileContent,
        ContentType: 'text/csv',
      });

      await s3.send(uploadParams);
      console.log(`✅ Uploaded ${file} to s3://${BUCKET_NAME}/${s3Key}`);
      uploadedCount++;
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error);
    }
  }

  const summary = `Uploaded ${uploadedCount} CSV file(s) to s3://${BUCKET_NAME}/${S3_FOLDER}/`;
  console.log(`
🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️
${summary}
🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️🏵️
`);

  return summary;
};
