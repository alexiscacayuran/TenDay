import s3 from "../aws.js";
import {
  ListObjectsV2Command,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = "seasonalforecast";

export const retrieveSeasonalFile = async (batch, valueType) => {
  const folderName = String(batch);
  let prefix = `${folderName}/`;

  let filterPrefix = (key) => true;
  if (valueType === "mm") {
    filterPrefix = (key) => key.split("/").pop().startsWith("RF");
  } else if (valueType === "pn") {
    filterPrefix = (key) => key.split("/").pop().startsWith("PN");
  }  

  console.log("📂 FolderPath:", prefix);

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix
    });

    const response = await s3.send(listCommand);
    const fileKeys = (response.Contents || [])
      .map((obj) => obj.Key)
      .filter((k) => {
        const fname = k.split("/").pop();
        const isMatch = fname.endsWith(".tif") && filterPrefix(k);
        if (isMatch) {
          console.log("✅ File matched:", fname);
        } else {
          console.log("❌ File skipped:", fname);
        }
        return isMatch;
      });
      

    const fileList = await Promise.all(
      fileKeys.map(async (key, i) => {
        const fileName = key.split("/").pop();
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const url = await getSignedUrl(s3, command, { expiresIn: 600 });
        return {
          key,
          file: fileName || `file_${i + 1}`,
          url
        };
      })
    );

    return fileList;
  } catch (error) {
    console.error("Error retrieving seasonal files:", error);
    throw new Error("Error retrieving seasonal files");
  }
};

export const streamSeasonalFile = async (key) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  return response.Body;
};
