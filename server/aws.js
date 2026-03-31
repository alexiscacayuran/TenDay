import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_R;
const accessKeyId = process.env.AWS_AKI;
const secretAccessKey = process.env.AWS_SAK;

if (!region) throw new Error("AWS_R is not set");
if (!accessKeyId) throw new Error("AWS_AKI is not set");
if (!secretAccessKey) throw new Error("AWS_SAK is not set");

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

export default s3;

