import fs from "fs";
import csv from "csv-parser";
import pool from "../db.js";
import crypto from "crypto";

// Function to compute the SHA-256 hash of a file
const hashFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
};

// Function to handle CSV file processing and insertion into PostgreSQL
const importCsvToDatabase = async (filePath) => {
    const results = [];
    const fileName = filePath.split('/').pop(); // Get just the file name from the path

    // Calculate the hash of the file to check for duplicates
    const fileHash = await hashFile(filePath);
    

    // Check if the file hash is already recorded in the activity log
    const logResult = await pool.query("SELECT * FROM activity_log WHERE file_hash = $1", [fileHash]);
    if (logResult.rows.length > 0) {
        // Delete the file if it's a duplicate
        fs.unlink(filePath, (err) => {
            if (err) console.error(`Error deleting file ${fileName}:`, err);
            else console.log(`Deleted duplicate file: ${fileName}`);
        });

        // Send response indicating duplicate file
        return res.status(403).json({
            message: `Duplicate file detected: ${fileName}. Import skipped.`,
            type: "duplicate",
        });
    }


    // Read and parse the CSV file
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))  // Push each row into the results array
            .on("end", async () => {
                try {
                    for (const row of results) {
                        const {
                            date, start_date, municity, province, tempmin, tempmax, tempmean, 
                            rainfallde, cloudcover, relhumidit, 
                            windspeed, winddirect
                        } = row;

                        // Fetch the municity ID
                        const municityResult = await pool.query(
                            "SELECT id FROM municities WHERE municity = $1 AND province = $2",
                            [municity, province]
                        );

                        if (municityResult.rows.length === 0) {
                            continue; // Skip to the next row if no municity found
                        }

                        const municityId = municityResult.rows[0].id;

                        // Insert into date table
                        const dateResult = await pool.query(
                            "INSERT INTO date (date, start_date, municity_id) VALUES ($1, $2, $3) RETURNING id",
                            [date, start_date, municityId]
                        );
                        const dateId = dateResult.rows[0].id; // Get the new DateID

                        // Insert into Temperature table
                        await pool.query(
                            "INSERT INTO temperature (mean, min, max, date_id) VALUES ($1, $2, $3, $4)",
                            [tempmean, tempmin, tempmax, dateId]
                        );

                        // Insert into Rainfall table
                        await pool.query(
                            "INSERT INTO rainfall (description, date_id) VALUES ($1, $2)",
                            [rainfallde, dateId]
                        );

                        // Insert into Cloud_cover table
                        await pool.query(
                            "INSERT INTO cloud_cover (description, date_id) VALUES ($1, $2)",
                            [cloudcover, dateId]
                        );

                        // Insert into Humidity table
                        await pool.query(
                            "INSERT INTO humidity (mean, date_id) VALUES ($1, $2)",
                            [relhumidit, dateId]
                        );

                        // Insert into Wind table
                        await pool.query(
                            "INSERT INTO wind (speed, direction, date_id) VALUES ($1, $2, $3)",
                            [windspeed, winddirect, dateId]
                        );
                    }

                    // Log the file import into the activity_log table with the file hash
                    await pool.query("INSERT INTO activity_log (file_name, file_hash, logdate) VALUES ($1, $2, NOW())", [fileName, fileHash]);

                    // Delete the file after processing
                    fs.unlink(filePath, (err) => {
                        if (err) console.error(`Error deleting file ${fileName}:`, err);
                        else console.log(`Deleted file: ${fileName}`);
                    });

                    // Resolve success message
                    resolve("CSV file imported successfully.");
                } catch (error) {
                    console.error("Error inserting data: ", error);
                    reject("Error inserting CSV data into the database");
                }
            })
            .on("error", (error) => {
                reject(`Error reading CSV file: ${error.message}`);
            });
    });
};

// Function to import multiple CSV files
const importMultipleCsvs = async (filePaths) => {
    const messages = [];
    try {
        for (const filePath of filePaths) {
            const message = await importCsvToDatabase(filePath);
            messages.push(message);
        }
        console.log("All CSV files imported successfully.");
        return messages; // Return messages for each import
    } catch (error) {
        console.error("Error importing CSV files: ", error);
        throw new Error("Error importing one or more CSV files");
    }
};

export { importCsvToDatabase, importMultipleCsvs };
