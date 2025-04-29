// cleanUpS3.js
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import cron from 'node-cron';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// Setup AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
});

const BUCKET_NAME = 'tendayforecast';

async function cleanUpExpiredFolders() {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Delimiter: '/', // to list folders
    });

    const data = await s3.send(listCommand);

    if (!data.CommonPrefixes) {
      console.log('No folders found.');
      return;
    }

    const today = dayjs().tz('Asia/Manila');

    for (const folder of data.CommonPrefixes) {
      const folderName = folder.Prefix.replace('/', ''); // Remove trailing slash

      // Check if folder name matches YYYYMMDD
      if (!/^\d{8}$/.test(folderName)) continue;

      const folderDate = dayjs(folderName, 'YYYYMMDD');

      if (!folderDate.isValid()) continue;

      const diffDays = today.diff(folderDate, 'day');

      if (diffDays >= 6) {
        console.log(`Deleting folder: ${folderName}`);

        // List all objects inside the folder
        const listObjectsInFolder = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: folder.Prefix,
        });

        const folderData = await s3.send(listObjectsInFolder);

        if (folderData.Contents && folderData.Contents.length > 0) {
          const objectsToDelete = folderData.Contents.map(obj => ({ Key: obj.Key }));

          const deleteCommand = new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: { Objects: objectsToDelete },
          });

          await s3.send(deleteCommand);

          console.log(`Folder ${folderName} deleted.`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up S3 folders:', error.message);
  }
}

// Schedule to run at 2PM Manila time everyday
cron.schedule('00 12 * * *', () => {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🕙 Running scheduled S3 cleanup task...`);
  cleanUpExpiredFolders();
}, {
  timezone: 'Asia/Manila',
});

export default cleanUpExpiredFolders;
