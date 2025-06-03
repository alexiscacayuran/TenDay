async function cleanUpExpiredFolders() {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Delimiter: '/', // to list folders
    });

    const data = await s3.send(listCommand);

    if (!data.CommonPrefixes || data.CommonPrefixes.length === 0) {
      console.log('No folders found.');
      return;
    }

    const today = dayjs().tz('Asia/Manila');

    // Extract valid folders in YYYYMMDD format
    const validFolders = data.CommonPrefixes
      .map(folder => folder.Prefix.replace('/', ''))
      .filter(name => /^\d{8}$/.test(name))
      .map(name => ({
        name,
        date: dayjs(name, 'YYYYMMDD'),
      }))
      .filter(f => f.date.isValid())
      .sort((a, b) => a.date.diff(b.date)); // sort by date ascending

    if (validFolders.length <= 1) {
      console.log('Only one folder found — skipping deletion.');
      return;
    }

    const latestFolder = validFolders[validFolders.length - 1].name;

    for (const { name: folderName, date: folderDate } of validFolders) {
      const diffDays = today.diff(folderDate, 'day');

      if (folderName === latestFolder) continue; // Never delete latest
      if (diffDays < 8) continue; // Keep folders less than 8 days old

      console.log(`Deleting folder: ${folderName}`);

      // List all objects inside the folder
      const listObjectsInFolder = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `${folderName}/`,
      });

      const folderData = await s3.send(listObjectsInFolder);

      if (folderData.Contents && folderData.Contents.length > 0) {
        const objectsToDelete = folderData.Contents.map(obj => ({ Key: obj.Key }));

        const deleteCommand = new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: { Objects: objectsToDelete },
        });

        await s3.send(deleteCommand);

        console.log(`✅ Folder ${folderName} deleted.`);
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up S3 folders:', error.message);
  }
}
