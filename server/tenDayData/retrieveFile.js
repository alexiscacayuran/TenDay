import moment from 'moment';
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.AWS_R;
const bucket = 'tendayforecast';

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_AKI,
    secretAccessKey: process.env.AWS_SAK,
  },
});

export const retrieveForecastFile = async (year, month, day, fileType, offset, masked, vector, specyear, specmonth, specday) => {
  const baseDate = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
  const folderName = baseDate.format('YYYYMMDD');
  const isMasked = masked === '1' || masked === 'true';

  // Case 1: Use offset to calculate file
  if (offset) {
    const offsetDate = baseDate.clone().add(parseInt(offset) - 1, 'days').format('YYYYMMDD');
    const filePath = getFileKeyForType(offsetDate, fileType, isMasked, vector);
    const fileKey = `${folderName}/${filePath}`;

    const command = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
    const url = await getSignedUrl(s3, command, { expiresIn: 600 });

    return [{
      file: fileKey.split('/').pop(),
      key: fileKey,
      url,
    }];
  }

  // Case 2: Specific file based on specyear, specmonth, specday
  if (specyear && specmonth && specday) {
    const specDate = moment(`${specyear}-${specmonth}-${specday}`, 'YYYY-MM-DD').format('YYYYMMDD');
    const filePath = getFileKeyForType(specDate, fileType, isMasked, vector);
    const fileKey = `${folderName}/${filePath}`;

    const command = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
    const url = await getSignedUrl(s3, command, { expiresIn: 600 });

    return [{
      file: fileKey.split('/').pop(),
      key: fileKey,
      url,
    }];
  }

  // Case 3: No offset or spec — get all files under folder/type
  const folderPath = (() => {
    const upperType = fileType.toUpperCase();
    if (upperType === 'XLSX') return `${folderName}/XLSX/`;
    if (['MEAN', 'MIN', 'MAX', 'RH', 'TCC', 'TP', 'WS'].includes(upperType)) return `${folderName}/${upperType}/`;
    if (upperType === 'WIND') return `${folderName}/WIND/`;
    return `${folderName}/`; // fallback
  })();

  const listCommand = new ListObjectsV2Command({ Bucket: bucket, Prefix: folderPath });
  const response = await s3.send(listCommand);

  const fileKeys = (response.Contents || [])
    .map(obj => obj.Key)
    .filter(k => k.endsWith('.xlsx') || k.endsWith('.tif') || k.endsWith('.asc'));

  return fileKeys.map((key, i) => {
    const fileName = key.split('/').pop();
    return {
      key,
      file: fileName || `file_${i + 1}`,
    };
  });
};


export const streamForecastFile = async (key) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  return response.Body;
};

// Helper to return correct file path inside S3
const getFileKeyForType = (date, type, isMasked, vector) => {
  const upperType = type.toUpperCase();
  const suffix = isMasked ? '_masked' : '';

  switch (upperType) {
    case 'XLSX':
      return `XLSX/FORECAST_${date}.xlsx`;

    case 'MEAN':
    case 'MIN':
    case 'MAX':
    case 'RH':
    case 'TCC':
    case 'TP':
    case 'WS':
      return `${upperType}/${upperType}_${date}${suffix}.tif`;

    case 'WIND':
      const windVector = vector?.toUpperCase() === 'U' ? 'U' : 'V';
      return `WIND/${windVector}_${date}${suffix}.asc`;

    default:
      throw new Error(`Unsupported file type: ${type}`);
  }
};
