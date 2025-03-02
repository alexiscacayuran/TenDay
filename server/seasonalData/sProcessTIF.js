import fs from "fs";
import path from "path";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";

// AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_R,
    credentials: {
        accessKeyId: process.env.AWS_AKI,
        secretAccessKey: process.env.AWS_SAK,
    },
    endpoint: `https://s3.${process.env.AWS_R}.amazonaws.com`, // ✅ Explicit endpoint
    forcePathStyle: true, // ✅ Required for some regions
    maxAttempts: 3,
});

// Convert batch number to Month-Year format
const getMonthYear = (batch) => {
    const baseBatch = 180; // 180 = Jan2025
    const baseDate = new Date(2025, 0); // Jan 2025
    const targetDate = new Date(baseDate.setMonth(baseDate.getMonth() + (batch - baseBatch)));

    const month = targetDate.toLocaleString("en-US", { month: "short" }); // "Jan"
    const year = targetDate.getFullYear(); // 2025
    return `${month}${year}`;
};

// Upload function with multipart (FAST UPLOADS)
const uploadToS3 = async (filePath, batch, newFileName) => {
    const bucketName = 'seasonalforecast';
    if (!bucketName) {
        throw new Error("❌ S3 Bucket name is missing in .env file!");
    }

    try {
        const fileStream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

        const upload = new Upload({
            client: s3,
            params: {
                Bucket: bucketName,
                Key: `${batch}/${newFileName}`,
                Body: fileStream,
                ContentType: "image/tiff",
            },
            partSize: 5 * 1024 * 1024, // 5MB chunks for speed
            queueSize: 5, // Parallel uploads
            leavePartsOnError: false,
        });

        await upload.done();
        console.log(`✅ Uploaded: ${bucketName}/${batch}/${newFileName}`);
    } catch (error) {
        console.error(`❌ Error uploading ${newFileName}:`, error.message);
    }
};

// Main processing function
export const processSeasonalFiles = async (batch) => {
    const batchFolder = `\\\\10.10.3.118\\climps\\Seasonal_forecasts\\${batch}_${getMonthYear(batch)}\\TIFF`;

    if (!fs.existsSync(batchFolder)) {
        throw new Error(`❌ Batch folder not found: ${batchFolder}`);
    }

    // Read files and ensure correct order (FRR1 -> FRR2 -> FRR3 -> ...)
    const files = fs.readdirSync(batchFolder)
        .filter(f => f.endsWith(".tif"))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
            const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
            return numA - numB;
        });

    if (files.length === 0) {
        throw new Error(`❌ No TIFF files found in ${batchFolder}`);
    }

    console.log(`📂 Found ${files.length} TIFF files in ${batchFolder}`);

    // Process and rename files sequentially
    for (let i = 0; i < files.length; i++) {
        const oldFilePath = path.join(batchFolder, files[i]);
        const renameMonthYear = getMonthYear(batch + 1 + Math.floor(i / 2)); // Start from batch + 1
        const suffix = i % 2 === 0 ? "RF" : "PN"; // Odd = RF, Even = PN
        const newFileName = `${suffix}_${renameMonthYear}.tif`;

        console.log(`🔄 Renaming ${files[i]} -> ${newFileName}`);
        await uploadToS3(oldFilePath, batch, newFileName);
    }

    console.log(`✅ Finished processing batch ${batch}`);
};
