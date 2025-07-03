import moment from "moment";
import s3 from "../aws.js";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = "tendayforecast";

const getFileKeyForType = (date, fileType, isMasked, specDate) => {
  const typeMap = {
    MEAN: "TMEAN",
    MIN: "TMIN",
    MAX: "TMAX",
  };

  const fileTypeLower = fileType.toLowerCase();

  // 🔁 Handle XLSX separately
  if (fileTypeLower === "xlsx") {
    return `TanawPH_${specDate}.xlsx`;
  }

  const fileTypeUpper = typeMap[fileType.toUpperCase()] || fileType.toUpperCase();
  let fileKey = `${fileTypeUpper}_`;
  fileKey += isMasked ? `${specDate}_masked` : `${specDate}`;
  fileKey += ".tif";

  return fileKey;
};


export const retrieveForecastFile = async (
  year,
  month,
  day,
  fileType,
  offset,
  masked,
  target // new merged date in YYYYMMDD format
) => {
  const baseDate = moment(`${year}-${month}-${day}`, "YYYY-MM-DD");
  const folderName = baseDate.format("YYYYMMDD");
  const isMasked = masked === "1" || masked === "true";

  const typeMap = {
    MEAN: "TMEAN",
    MIN: "TMIN",
    MAX: "TMAX",
  };
  const mappedType = typeMap[fileType.toUpperCase()] || fileType.toUpperCase();

  let specDate;
  if (target && /^\d{8}$/.test(target)) {
    specDate = target;
  }

  // 📦 With offset
  if (offset) {
    const offsetDate = baseDate
      .clone()
      .add(parseInt(offset) - 1, "days")
      .format("YYYYMMDD");
    const filePath = getFileKeyForType(
      offsetDate,
      fileType,
      isMasked,
      specDate
    );
    const fileKey = `${folderName}/${mappedType}/${filePath}`;
    const command = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
    const url = await getSignedUrl(s3, command, { expiresIn: 600 });
    return [
      {
        file: fileKey.split("/").pop(),
        key: fileKey,
        url,
      },
    ];
  }

  // 🗂 Specific target date
  if (specDate) {
    const filePath = getFileKeyForType(
      folderName,
      fileType,
      isMasked,
      specDate
    );
    const fileKey = `${folderName}/${mappedType}/${filePath}`;
    const command = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
    const url = await getSignedUrl(s3, command, { expiresIn: 600 });
    return [
      {
        file: fileKey.split("/").pop(),
        key: fileKey,
        url,
      },
    ];
  }

  // 📂 Default folder listing
  const folderPath =
  fileType.toLowerCase() === "all" ? `${folderName}/` :
  mappedType === "XLSX"
    ? `${folderName}/XLSX/`
    : `${folderName}/${mappedType}/`;


  console.log(`Checking S3 folder: ${folderPath}`);

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: folderPath,
    });
    const response = await s3.send(listCommand);

    console.log("Files in folder:", response.Contents);

    const fileKeys = (response.Contents || [])
      .map((obj) => obj.Key)
      .filter((k) => {
        console.log(`File found: ${k}`);
        return k.endsWith(".tif") || k.endsWith(".xlsx");
      });

    if (fileKeys.length === 0) {
      console.log(`No files found for ${fileType}`);
    }

    const fileList = await Promise.all(
      fileKeys.map(async (key, i) => {
        const fileName = key.split("/").pop();
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const url = await getSignedUrl(s3, command, { expiresIn: 600 });

        return {
          key,
          file: fileName || `file_${i + 1}`,
          url,
        };
      })
    );

    return fileList;
  } catch (error) {
    console.error("Error retrieving files:", error);
    throw new Error("Error retrieving files");
  }
};

export const streamForecastFile = async (key) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  return response.Body;
};
