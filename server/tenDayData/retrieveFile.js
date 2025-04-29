import moment from 'moment';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = 'tendayforecast';

const s3 = new S3Client({
  region: process.env.AWS_R,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
});

// Define the function to generate file keys
const getFileKeyForType = (date, fileType, isMasked, vector, specDate) => {
  const fileTypeUpper = fileType.toUpperCase();
  let fileKey = '';

  if (fileTypeUpper === 'WIND') {
    fileKey += vector === 'u' ? `U_` : `V_`; // WIND files have vector-based prefixes
  } else {
    fileKey += `${fileTypeUpper}_`; // MEAN, RH, etc., with type as prefix
  }

  if (isMasked) {
    fileKey += `${specDate}_masked`; // Masked version
  } else {
    fileKey += `${specDate}`; // Regular version
  }

  if (fileTypeUpper === 'WIND') {
    fileKey += '.asc'; // WIND files are .asc
  } else if (['MEAN', 'RH', 'TCC', 'MIN', 'MAX', 'TP', 'WS'].includes(fileTypeUpper)) {
    fileKey += '.tif'; // .tif for MEAN, RH, etc.
  } else {
    fileKey += '.xlsx'; // XLSX files
  }

  return fileKey;
};

export const retrieveForecastFile = async (year, month, day, fileType, offset, masked, vector, specyear, specmonth, specday) => {
  const baseDate = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
  const folderName = baseDate.format('YYYYMMDD'); // Folder name as "20250425"
  const isMasked = masked === '1' || masked === 'true'; // Boolean value for masked

  let specDate;
  if (specyear && specmonth && specday) {
    specDate = moment(`${specyear}-${specmonth}-${specday}`, 'YYYY-MM-DD').format('YYYYMMDD');
  }

  // If offset is provided, calculate the offset date and retrieve that file
  if (offset) {
    const offsetDate = baseDate.clone().add(parseInt(offset) - 1, 'days').format('YYYYMMDD');
    const filePath = getFileKeyForType(offsetDate, fileType, isMasked, vector, specDate);
    const fileKey = `${folderName}/${fileType.toUpperCase()}/${filePath}`;
    const command = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
    const url = await getSignedUrl(s3, command, { expiresIn: 600 });
    return [{
      file: fileKey.split('/').pop(),
      key: fileKey,
      url,
    }];
  }

  // If specDate is provided, use it to fetch specific files
  if (specDate) {
    const filePath = getFileKeyForType(folderName, fileType, isMasked, vector, specDate);
    const fileKey = `${folderName}/${fileType.toUpperCase()}/${filePath}`;
    const command = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
    const url = await getSignedUrl(s3, command, { expiresIn: 600 });
    return [{
      file: fileKey.split('/').pop(),
      key: fileKey,
      url,
    }];
  }

  // Default case: if no specDate, list files in the folder
  const folderPath = (() => {
    const upperType = fileType.toUpperCase();
    if (upperType === 'XLSX') return `${folderName}/XLSX/`;
    if (['MEAN', 'MIN', 'MAX', 'RH', 'TCC', 'TP'].includes(upperType)) return `${folderName}/${upperType}/`;
    if (upperType === 'WIND') return `${folderName}/WIND/`;
    return `${folderName}/`;
  })();

  console.log(`Checking S3 folder: ${folderPath}`);

  try {
    const listCommand = new ListObjectsV2Command({ Bucket: bucket, Prefix: folderPath });
    const response = await s3.send(listCommand);

    // Log all files in the folder for debugging
    console.log('Files in folder:', response.Contents);

    const fileKeys = (response.Contents || [])
      .map(obj => obj.Key)
      .filter(k => {
        console.log(`File found: ${k}`);
        return k.endsWith('.tif') || k.endsWith('.asc') || k.endsWith('.xlsx');
      });

    if (fileKeys.length === 0) {
      console.log(`No files found for ${fileType}`);
    }

    // Return the files as signed URLs
    const fileList = await Promise.all(fileKeys.map(async (key, i) => {
      const fileName = key.split('/').pop();
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const url = await getSignedUrl(s3, command, { expiresIn: 600 });

      return {
        key,
        file: fileName || `file_${i + 1}`,
        url,
      };
    }));

    return fileList;
  } catch (error) {
    console.error('Error retrieving files:', error);
    throw new Error('Error retrieving files');
  }
};

export const streamForecastFile = async (key) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  return response.Body;
};
