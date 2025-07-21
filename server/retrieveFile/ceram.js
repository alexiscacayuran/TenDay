import s3 from "../aws.js";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = "ceram"; // Update to your actual CERAM bucket name

/**
 * Retrieves CERAM files from S3 based on the query structure:
 * climate_indicator → indicator_code → percentile → ssp
 */
export const retrieveCeramFiles = async (
  climate_indicator,
  indicator_code,
  percentile,
  ssp
) => {
  if (!climate_indicator) {
    throw new Error("climate_indicator is required");
  }

  const allowedIndicators = ["RR", "TMAX", "TMIN"];
  const indicatorUpper = climate_indicator.toUpperCase();

  if (!allowedIndicators.includes(indicatorUpper)) {
    throw new Error("Invalid climate_indicator. Must be one of RR, TMAX, TMIN.");
  }

  // 💡 Prevent access to deeper paths without parents
  if ((percentile || ssp) && !indicator_code) {
    throw new Error("indicator_code is required when using percentile or ssp.");
  }

  let folderPath = `${indicatorUpper}/`;
  if (indicator_code) folderPath += `${indicator_code}/`;
  if (percentile) folderPath += `${percentile}/`;
  if (ssp) folderPath += `${ssp}/`;

  try {
    console.log(`🔍 Checking CERAM S3 path: ${folderPath}`);

    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: folderPath,
    });

    const response = await s3.send(listCommand);

    const fileKeys = (response.Contents || [])
      .map(obj => obj.Key)
      .filter(k => k.endsWith(".tif") || k.endsWith(".xlsx"));

    if (fileKeys.length === 0) {
      console.warn("⚠️ No CERAM files found.");
      return [];
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
    console.error("❌ Error retrieving CERAM files:", error);
    throw new Error("Failed to retrieve CERAM files.");
  }
};

/**
 * Streams a single file from CERAM S3 bucket
 */
export const streamCeramFile = async (key) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  return response.Body;
};
